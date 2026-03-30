package navtreeimpl

import (
	"context"
	"fmt"
	"net/http"
	"testing"

	"github.com/stretchr/testify/mock"
	"github.com/stretchr/testify/require"

	"github.com/grafana/grafana/pkg/infra/log"
	ac "github.com/grafana/grafana/pkg/services/accesscontrol"
	accesscontrolmock "github.com/grafana/grafana/pkg/services/accesscontrol/mock"
	"github.com/grafana/grafana/pkg/services/authn"
	"github.com/grafana/grafana/pkg/services/authn/authntest"
	contextmodel "github.com/grafana/grafana/pkg/services/contexthandler/model"
	"github.com/grafana/grafana/pkg/services/dashboards"
	"github.com/grafana/grafana/pkg/services/featuremgmt"
	"github.com/grafana/grafana/pkg/services/licensing"
	"github.com/grafana/grafana/pkg/services/navtree"
	"github.com/grafana/grafana/pkg/services/pluginsintegration/pluginsettings"
	"github.com/grafana/grafana/pkg/services/pluginsintegration/pluginstore"
	pref "github.com/grafana/grafana/pkg/services/preference"
	"github.com/grafana/grafana/pkg/services/search/model"
	"github.com/grafana/grafana/pkg/services/star"
	"github.com/grafana/grafana/pkg/services/star/startest"
	"github.com/grafana/grafana/pkg/services/user"
	"github.com/grafana/grafana/pkg/setting"
	"github.com/grafana/grafana/pkg/web"
)

func TestBuildStarredItemsNavLinks(t *testing.T) {
	httpReq, _ := http.NewRequest(http.MethodGet, "", nil)
	reqCtx := &contextmodel.ReqContext{
		SignedInUser: &user.SignedInUser{
			UserID: 1,
			OrgID:  1,
		},
		Context: &web.Context{Req: httpReq},
	}

	t.Run("Should return empty list when there are no starred dashboards", func(t *testing.T) {
		starService := startest.NewStarServiceFake()
		starService.ExpectedUserStars = &star.GetUserStarsResult{
			UserStars: map[string]bool{},
		}

		service := ServiceImpl{
			starService: starService,
		}

		navLinks, err := service.buildStarredItemsNavLinks(reqCtx)
		require.NoError(t, err)
		require.Empty(t, navLinks)
	})

	t.Run("Should return nav links for starred dashboards", func(t *testing.T) {
		starService := startest.NewStarServiceFake()
		starService.ExpectedUserStars = &star.GetUserStarsResult{
			UserStars: map[string]bool{
				"dashboard1": true,
				"dashboard2": true,
			},
		}

		dashboardService := dashboards.NewFakeDashboardService(t)
		dashboardService.On("SearchDashboards", context.Background(), mock.Anything).Return(model.HitList{
			{
				UID:   "dashboard1",
				Title: "Dashboard 1",
				URL:   "/d/dashboard1/",
			},
			{
				UID:   "dashboard2",
				Title: "Dashboard 2",
				URL:   "/d/dashboard2/",
			},
		}, nil)

		service := ServiceImpl{
			starService:      starService,
			dashboardService: dashboardService,
		}

		navLinks, err := service.buildStarredItemsNavLinks(reqCtx)
		require.NoError(t, err)
		require.Len(t, navLinks, 2)

		require.Equal(t, "starred/dashboard1", navLinks[0].Id)
		require.Equal(t, "Dashboard 1", navLinks[0].Text)
		require.Equal(t, "/d/dashboard1/", navLinks[0].Url)
		require.Equal(t, "starred/dashboard2", navLinks[1].Id)
		require.Equal(t, "Dashboard 2", navLinks[1].Text)
		require.Equal(t, "/d/dashboard2/", navLinks[1].Url)
	})

	t.Run("Should limit to 50 starred dashboards", func(t *testing.T) {
		starService := startest.NewStarServiceFake()
		userStars := make(map[string]bool)
		for i := 0; i < 60; i++ {
			userStars[fmt.Sprintf("dashboard%d", i)] = true
		}
		starService.ExpectedUserStars = &star.GetUserStarsResult{
			UserStars: userStars,
		}

		dashboardList := make(model.HitList, 60)
		for i := 0; i < 60; i++ {
			dashboardList[i] = &model.Hit{
				UID:   fmt.Sprintf("dashboard%d", i),
				Title: fmt.Sprintf("Dashboard %d", i),
				URL:   fmt.Sprintf("/d/dashboard%d/", i),
			}
		}

		dashboardService := dashboards.NewFakeDashboardService(t)
		dashboardService.On("SearchDashboards", context.Background(), mock.Anything).Return(dashboardList, nil)

		service := ServiceImpl{
			starService:      starService,
			dashboardService: dashboardService,
		}

		navLinks, err := service.buildStarredItemsNavLinks(reqCtx)
		require.NoError(t, err)
		require.Len(t, navLinks, 50)
	})

	t.Run("Should sort dashboards by title", func(t *testing.T) {
		starService := startest.NewStarServiceFake()
		starService.ExpectedUserStars = &star.GetUserStarsResult{
			UserStars: map[string]bool{
				"dashboard1": true,
				"dashboard2": true,
				"dashboard3": true,
			},
		}

		dashboardService := dashboards.NewFakeDashboardService(t)
		dashboardService.On("SearchDashboards", context.Background(), mock.Anything).Return(model.HitList{
			{
				UID:   "dashboard1",
				Title: "C Dashboard",
				URL:   "/d/dashboard1/",
			},
			{
				UID:   "dashboard2",
				Title: "A Dashboard",
				URL:   "/d/dashboard2/",
			},
			{
				UID:   "dashboard3",
				Title: "B Dashboard",
				URL:   "/d/dashboard3/",
			},
		}, nil)

		service := ServiceImpl{
			starService:      starService,
			dashboardService: dashboardService,
		}

		navLinks, err := service.buildStarredItemsNavLinks(reqCtx)
		require.NoError(t, err)
		require.Len(t, navLinks, 3)

		require.Equal(t, "A Dashboard", navLinks[0].Text)
		require.Equal(t, "B Dashboard", navLinks[1].Text)
		require.Equal(t, "C Dashboard", navLinks[2].Text)
	})
}

func TestGetNavTree_LabsSection(t *testing.T) {
	cfg := setting.NewCfg()

	service := ServiceImpl{
		cfg:            cfg,
		log:            log.New("navtree-test"),
		accessControl:  accesscontrolmock.New().WithPermissions([]ac.Permission{}),
		pluginStore:    &pluginstore.FakePluginStore{PluginList: []pluginstore.Plugin{}},
		pluginSettings: &pluginsettings.FakePluginSettings{Plugins: map[string]*pluginsettings.DTO{}},
		features:       featuremgmt.WithFeatures(),
		starService:    startest.NewStarServiceFake(),
		license:        &licensing.OSSLicensingService{Cfg: cfg},
		authnService:   &authntest.FakeService{ExpectedIdentity: &authn.Identity{}},
	}

	t.Run("Signed-in user sees Labs nav node", func(t *testing.T) {
		httpReq, _ := http.NewRequest(http.MethodGet, "", nil)
		reqCtx := &contextmodel.ReqContext{
			SignedInUser: &user.SignedInUser{UserID: 1, OrgID: 1},
			Context:      &web.Context{Req: httpReq},
			IsSignedIn:   true,
		}

		treeRoot, err := service.GetNavTree(reqCtx, &pref.Preference{})
		require.NoError(t, err)

		labsNode := treeRoot.FindById(navtree.NavIDLabs)
		require.NotNil(t, labsNode, "Labs nav node should exist for signed-in users")
		require.Equal(t, "labs", labsNode.Id)
		require.Equal(t, "/labs", labsNode.Url)
		require.Equal(t, "Labs", labsNode.Text)
	})

	t.Run("Anonymous user does not see Labs nav node", func(t *testing.T) {
		httpReq, _ := http.NewRequest(http.MethodGet, "", nil)
		reqCtx := &contextmodel.ReqContext{
			SignedInUser: &user.SignedInUser{IsAnonymous: true},
			Context:      &web.Context{Req: httpReq},
			IsSignedIn:   false,
		}

		treeRoot, err := service.GetNavTree(reqCtx, &pref.Preference{})
		require.NoError(t, err)

		labsNode := treeRoot.FindById(navtree.NavIDLabs)
		require.Nil(t, labsNode, "Labs nav node should not exist for anonymous users")
	})
}

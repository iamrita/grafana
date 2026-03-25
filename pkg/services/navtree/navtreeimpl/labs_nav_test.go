package navtreeimpl

import (
	"context"
	"net/http"
	"testing"

	claims "github.com/grafana/authlib/types"
	"github.com/stretchr/testify/require"

	"github.com/grafana/grafana/pkg/apimachinery/identity"
	"github.com/grafana/grafana/pkg/infra/log"
	"github.com/grafana/grafana/pkg/services/accesscontrol"
	accesscontrolmock "github.com/grafana/grafana/pkg/services/accesscontrol/mock"
	contextmodel "github.com/grafana/grafana/pkg/services/contexthandler/model"
	"github.com/grafana/grafana/pkg/services/authn"
	"github.com/grafana/grafana/pkg/services/authn/authntest"
	"github.com/grafana/grafana/pkg/services/featuremgmt"
	"github.com/grafana/grafana/pkg/services/licensing"
	"github.com/grafana/grafana/pkg/services/navtree"
	"github.com/grafana/grafana/pkg/services/pluginsintegration/pluginsettings"
	"github.com/grafana/grafana/pkg/services/pluginsintegration/pluginstore"
	"github.com/grafana/grafana/pkg/services/org"
	pref "github.com/grafana/grafana/pkg/services/preference"
	"github.com/grafana/grafana/pkg/services/user"
	"github.com/grafana/grafana/pkg/setting"
	"github.com/grafana/grafana/pkg/web"
)

func TestGetNavTree_includesLabsForSignedInUser(t *testing.T) {
	httpReq, _ := http.NewRequest(http.MethodGet, "", nil)
	reqCtx := &contextmodel.ReqContext{
		SignedInUser: &user.SignedInUser{
			UserID:      1,
			OrgID:       1,
			OrgRole:     org.RoleViewer,
			Permissions: map[int64]map[string][]string{},
		},
		IsSignedIn: true,
		Context:    &web.Context{Req: httpReq},
	}

	cfg := setting.NewCfg()
	// Minimize nav sections that require extra deps.
	cfg.ExploreEnabled = false
	cfg.ProfileEnabled = false
	uaOff := false
	cfg.UnifiedAlerting.Enabled = &uaOff

	acMock := accesscontrolmock.New()
	acMock.EvaluateFunc = func(context.Context, identity.Requester, accesscontrol.Evaluator) (bool, error) {
		return false, nil
	}

	s := ServiceImpl{
		cfg:            cfg,
		features:       featuremgmt.WithFeatures(),
		accessControl:  acMock,
		authnService: &authntest.FakeService{
			ExpectedIdentity: &authn.Identity{Type: claims.TypeUser, ID: "user:1"},
		},
		pluginStore:    &pluginstore.FakePluginStore{PluginList: []pluginstore.Plugin{}},
		pluginSettings: &pluginsettings.FakePluginSettings{Plugins: map[string]*pluginsettings.DTO{}},
		license:        &licensing.OSSLicensingService{Cfg: cfg},
		log:            log.New("navtree-test"),
	}

	tree, err := s.GetNavTree(reqCtx, &pref.Preference{})
	require.NoError(t, err)

	lab := tree.FindById(navtree.NavIDLabs)
	require.NotNil(t, lab)
	require.Equal(t, "Labs", lab.Text)
	require.Equal(t, "/labs", lab.Url)
	require.EqualValues(t, navtree.WeightLabs, lab.SortWeight)
}

func TestGetNavTree_omitsLabsWhenNotSignedIn(t *testing.T) {
	httpReq, _ := http.NewRequest(http.MethodGet, "", nil)
	reqCtx := &contextmodel.ReqContext{
		SignedInUser: &user.SignedInUser{UserID: 1, OrgID: 1},
		IsSignedIn:   false,
		Context:      &web.Context{Req: httpReq},
	}

	cfg := setting.NewCfg()
	cfg.ExploreEnabled = false
	cfg.ProfileEnabled = false
	uaOff := false
	cfg.UnifiedAlerting.Enabled = &uaOff

	acMock := accesscontrolmock.New()
	acMock.EvaluateFunc = func(context.Context, identity.Requester, accesscontrol.Evaluator) (bool, error) {
		return false, nil
	}

	s := ServiceImpl{
		cfg:           cfg,
		features:      featuremgmt.WithFeatures(),
		accessControl: acMock,
		authnService: &authntest.FakeService{
			ExpectedIdentity: &authn.Identity{Type: claims.TypeUser, ID: "user:1"},
		},
		pluginStore:    &pluginstore.FakePluginStore{PluginList: []pluginstore.Plugin{}},
		pluginSettings: &pluginsettings.FakePluginSettings{Plugins: map[string]*pluginsettings.DTO{}},
		license:        &licensing.OSSLicensingService{Cfg: cfg},
		log:            log.New("navtree-test"),
	}

	tree, err := s.GetNavTree(reqCtx, &pref.Preference{})
	require.NoError(t, err)
	require.Nil(t, tree.FindById(navtree.NavIDLabs))
}

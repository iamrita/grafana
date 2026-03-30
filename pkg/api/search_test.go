package api

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"github.com/grafana/grafana/pkg/services/org"
	"github.com/grafana/grafana/pkg/services/search"
	"github.com/grafana/grafana/pkg/services/search/model"
	"github.com/grafana/grafana/pkg/services/user"
	"github.com/grafana/grafana/pkg/web/webtest"
)

type fakeSearchService struct {
	hits        model.HitList
	searchErr   error
	sortOptions []model.SortOption
}

func (f *fakeSearchService) SearchHandler(_ context.Context, _ *search.Query) (model.HitList, error) {
	if f.searchErr != nil {
		return nil, f.searchErr
	}
	return f.hits, nil
}

func (f *fakeSearchService) SortOptions() []model.SortOption {
	return f.sortOptions
}

func TestAPI_SearchEndpoint(t *testing.T) {
	t.Run("returns search hits from SearchService", func(t *testing.T) {
		expected := model.HitList{
			{UID: "dash-uid", Title: "My dashboard", Type: model.DashHitDB},
		}
		server := SetupAPITestServer(t, func(hs *HTTPServer) {
			hs.SearchService = &fakeSearchService{hits: expected}
		})

		req := server.NewGetRequest("/api/search/")
		webtest.RequestWithSignedInUser(req, &user.SignedInUser{
			UserID:  1,
			OrgID:   1,
			OrgRole: org.RoleEditor,
		})

		res, err := server.Send(req)
		require.NoError(t, err)
		assert.Equal(t, http.StatusOK, res.StatusCode)
		defer func() { require.NoError(t, res.Body.Close()) }()

		var got model.HitList
		require.NoError(t, json.NewDecoder(res.Body).Decode(&got))
		require.Len(t, got, 1)
		assert.Equal(t, "dash-uid", got[0].UID)
		assert.Equal(t, "My dashboard", got[0].Title)
		assert.Equal(t, model.DashHitDB, got[0].Type)
	})

	t.Run("returns 422 when limit exceeds maximum", func(t *testing.T) {
		server := SetupAPITestServer(t, func(hs *HTTPServer) {
			hs.SearchService = &fakeSearchService{hits: model.HitList{}}
		})

		req := server.NewGetRequest("/api/search/?limit=5001")
		webtest.RequestWithSignedInUser(req, &user.SignedInUser{
			UserID:  1,
			OrgID:   1,
			OrgRole: org.RoleEditor,
		})

		res, err := server.Send(req)
		require.NoError(t, err)
		assert.Equal(t, http.StatusUnprocessableEntity, res.StatusCode)
		require.NoError(t, res.Body.Close())
	})

	t.Run("returns 400 when both dashboard IDs and UIDs are provided", func(t *testing.T) {
		server := SetupAPITestServer(t, func(hs *HTTPServer) {
			hs.SearchService = &fakeSearchService{hits: model.HitList{}}
		})

		req := server.NewGetRequest("/api/search/?dashboardIds=1&dashboardUIDs=abc")
		webtest.RequestWithSignedInUser(req, &user.SignedInUser{
			UserID:  1,
			OrgID:   1,
			OrgRole: org.RoleEditor,
		})

		res, err := server.Send(req)
		require.NoError(t, err)
		assert.Equal(t, http.StatusBadRequest, res.StatusCode)
		require.NoError(t, res.Body.Close())
	})

	t.Run("returns 401 when requesting deleted dashboards as non-admin", func(t *testing.T) {
		server := SetupAPITestServer(t, func(hs *HTTPServer) {
			hs.SearchService = &fakeSearchService{hits: model.HitList{}}
		})

		req := server.NewGetRequest("/api/search/?deleted=true")
		webtest.RequestWithSignedInUser(req, &user.SignedInUser{
			UserID:  1,
			OrgID:   1,
			OrgRole: org.RoleViewer,
		})

		res, err := server.Send(req)
		require.NoError(t, err)
		assert.Equal(t, http.StatusUnauthorized, res.StatusCode)
		require.NoError(t, res.Body.Close())
	})

	t.Run("returns 500 when SearchHandler fails", func(t *testing.T) {
		server := SetupAPITestServer(t, func(hs *HTTPServer) {
			hs.SearchService = &fakeSearchService{searchErr: errors.New("store unavailable")}
		})

		req := server.NewGetRequest("/api/search/")
		webtest.RequestWithSignedInUser(req, &user.SignedInUser{
			UserID:  1,
			OrgID:   1,
			OrgRole: org.RoleEditor,
		})

		res, err := server.Send(req)
		require.NoError(t, err)
		assert.Equal(t, http.StatusInternalServerError, res.StatusCode)
		require.NoError(t, res.Body.Close())
	})
}

func TestAPI_ListSortOptionsEndpoint(t *testing.T) {
	server := SetupAPITestServer(t, func(hs *HTTPServer) {
		hs.SearchService = &fakeSearchService{
			sortOptions: []model.SortOption{
				{Name: "alpha", DisplayName: "A-Z", Description: "alphabetical", MetaName: "alpha_meta"},
			},
		}
	})

	req := server.NewGetRequest("/api/search/sorting")
	webtest.RequestWithSignedInUser(req, &user.SignedInUser{
		UserID:  1,
		OrgID:   1,
		OrgRole: org.RoleViewer,
	})

	res, err := server.Send(req)
	require.NoError(t, err)
	assert.Equal(t, http.StatusOK, res.StatusCode)
	defer func() { require.NoError(t, res.Body.Close()) }()

	var body map[string]any
	require.NoError(t, json.NewDecoder(res.Body).Decode(&body))

	sortOptions, ok := body["sortOptions"].([]any)
	require.True(t, ok, "expected sortOptions array, got %T", body["sortOptions"])
	require.Len(t, sortOptions, 1)
	first, ok := sortOptions[0].(map[string]any)
	require.True(t, ok)
	assert.Equal(t, "alpha", first["name"])
	assert.Equal(t, "A-Z", first["displayName"])
	assert.Equal(t, "alphabetical", first["description"])
	assert.Equal(t, "alpha_meta", first["meta"])
}

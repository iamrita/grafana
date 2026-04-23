package labs

import (
	"testing"

	"github.com/stretchr/testify/require"

	featuretoggleapi "github.com/grafana/grafana/pkg/services/featuremgmt/feature_toggle_api"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

func TestBuildLabsFeatureFlagsResponse_orderAndBrowserOverride(t *testing.T) {
	list := featuretoggleapi.FeatureList{
		Items: []featuretoggleapi.Feature{
			{
				ObjectMeta: metav1.ObjectMeta{Name: "influxdbBackendMigration"},
				Spec: featuretoggleapi.FeatureSpec{
					Description:     "Query InfluxDB InfluxQL without the proxy",
					Stage:           "GA",
					FrontendOnly:    true,
					RequiresRestart: false,
					Expression:      "true",
				},
			},
			{
				ObjectMeta: metav1.ObjectMeta{Name: "publicDashboardsScene"},
				Spec: featuretoggleapi.FeatureSpec{
					Description:  "Enables public dashboard rendering using scenes",
					Stage:        "GA",
					FrontendOnly: true,
					Expression:   "true",
				},
			},
		},
	}

	enabled := map[string]bool{"publicDashboardsScene": true}
	resp := BuildLabsFeatureFlagsResponse(list, enabled, []string{"influxdbBackendMigration"})

	require.Len(t, resp.Flags, 2)
	require.Equal(t, "publicDashboardsScene", resp.Flags[0].Name)
	require.True(t, resp.Flags[0].Enabled)
	require.True(t, resp.Flags[0].BrowserOverrideAllowed)

	require.Equal(t, "influxdbBackendMigration", resp.Flags[1].Name)
	require.False(t, resp.Flags[1].Enabled)
	require.True(t, resp.Flags[1].ServerConfigured)
	require.True(t, resp.Flags[1].BrowserOverrideAllowed)
}

func TestBuildLabsFeatureFlagsResponse_skipsHideFromDocs(t *testing.T) {
	list := featuretoggleapi.FeatureList{
		Items: []featuretoggleapi.Feature{
			{
				ObjectMeta: metav1.ObjectMeta{Name: "publicDashboardsScene"},
				Spec: featuretoggleapi.FeatureSpec{
					Description:  "x",
					Stage:        "GA",
					FrontendOnly: true,
					HideFromDocs: true,
					Expression:   "true",
				},
			},
			{
				ObjectMeta: metav1.ObjectMeta{Name: "influxdbBackendMigration"},
				Spec: featuretoggleapi.FeatureSpec{
					Description:  "y",
					Stage:        "GA",
					FrontendOnly: true,
					Expression:   "true",
				},
			},
		},
	}
	resp := BuildLabsFeatureFlagsResponse(list, map[string]bool{}, nil)
	require.Len(t, resp.Flags, 1)
	require.Equal(t, "influxdbBackendMigration", resp.Flags[0].Name)
}

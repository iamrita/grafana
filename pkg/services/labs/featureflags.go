package labs

import (
	"strings"

	featuretoggleapi "github.com/grafana/grafana/pkg/services/featuremgmt/feature_toggle_api"
)

// LabsCuratedFeatureFlagNames is an explicit allowlist of feature toggles that may be
// exposed in the Labs UI for all signed-in users. Do not derive this list from the
// full registry at runtime.
var LabsCuratedFeatureFlagNames = []string{
	"publicDashboardsScene",
	"influxdbBackendMigration",
}

// LabsCuratedFeatureFlagSet is a set view of LabsCuratedFeatureFlagNames for fast lookup.
var LabsCuratedFeatureFlagSet = func() map[string]struct{} {
	m := make(map[string]struct{}, len(LabsCuratedFeatureFlagNames))
	for _, n := range LabsCuratedFeatureFlagNames {
		m[n] = struct{}{}
	}
	return m
}()

// IsLabsCuratedFlag returns true if name is in the Labs curated allowlist.
func IsLabsCuratedFlag(name string) bool {
	_, ok := LabsCuratedFeatureFlagSet[name]
	return ok
}

// LabsFeatureFlagDTO is the JSON shape returned by GET /api/labs/feature-flags.
type LabsFeatureFlagDTO struct {
	Name             string `json:"name"`
	Description      string `json:"description"`
	Stage            string `json:"stage"`
	FrontendOnly     bool   `json:"frontendOnly"`
	RequiresRestart  bool   `json:"requiresRestart"`
	RequiresDevMode  bool   `json:"requiresDevMode"`
	HideFromDocs     bool   `json:"hideFromDocs"`
	Enabled          bool   `json:"enabled"`
	ServerConfigured bool   `json:"serverConfigured"`
	// BrowserOverrideAllowed is true when the flag may be toggled from the browser for this user
	// (localStorage / safe URL overrides), without persisting server-side config.
	BrowserOverrideAllowed bool `json:"browserOverrideAllowed"`
}

// LabsFeatureFlagsResponse is the top-level response for GET /api/labs/feature-flags.
type LabsFeatureFlagsResponse struct {
	Flags []LabsFeatureFlagDTO `json:"flags"`
}

// BuildLabsFeatureFlagsResponse merges embedded feature metadata with runtime enabled state.
// enabled is the map from FeatureToggles.GetEnabled (keys present mean enabled).
// startupKeys lists flag names explicitly set in server config (may include unknown keys).
func BuildLabsFeatureFlagsResponse(list featuretoggleapi.FeatureList, enabled map[string]bool, startupKeys []string) LabsFeatureFlagsResponse {
	startupSet := make(map[string]struct{}, len(startupKeys))
	for _, k := range startupKeys {
		startupSet[k] = struct{}{}
	}

	out := make([]LabsFeatureFlagDTO, 0, len(LabsCuratedFeatureFlagNames))
	for _, want := range LabsCuratedFeatureFlagNames {
		var spec *featuretoggleapi.FeatureSpec
		for i := range list.Items {
			if list.Items[i].Name == want {
				s := list.Items[i].Spec
				spec = &s
				break
			}
		}
		if spec == nil {
			continue
		}
		if spec.HideFromDocs || spec.RequiresDevMode {
			continue
		}
		// Only documented, non-dev flags in Labs.
		name := want
		_, serverConfigured := startupSet[name]
		isEnabled := enabled[name]
		browserAllowed := spec.FrontendOnly && !spec.RequiresRestart &&
			(strings.EqualFold(spec.Stage, "GA") || strings.EqualFold(spec.Stage, "stable") || strings.EqualFold(spec.Stage, "ga"))

		out = append(out, LabsFeatureFlagDTO{
			Name:                   name,
			Description:            spec.Description,
			Stage:                  spec.Stage,
			FrontendOnly:           spec.FrontendOnly,
			RequiresRestart:        spec.RequiresRestart,
			RequiresDevMode:        spec.RequiresDevMode,
			HideFromDocs:           spec.HideFromDocs,
			Enabled:                isEnabled,
			ServerConfigured:       serverConfigured,
			BrowserOverrideAllowed: browserAllowed,
		})
	}

	return LabsFeatureFlagsResponse{Flags: out}
}

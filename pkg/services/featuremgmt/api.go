package featuremgmt

import "slices"

type FeatureFlagDTO struct {
	Name            string `json:"name"`
	Description     string `json:"description"`
	Stage           string `json:"stage"`
	Owner           string `json:"owner,omitempty"`
	Expression      string `json:"expression,omitempty"`
	FrontendOnly    bool   `json:"frontendOnly"`
	RequiresRestart bool   `json:"requiresRestart"`
	RequiresDevMode bool   `json:"requiresDevMode"`
	HideFromDocs    bool   `json:"hideFromDocs"`
}

func GetFeatureFlags() ([]FeatureFlagDTO, error) {
	featureList, err := GetEmbeddedFeatureList()
	if err != nil {
		return nil, err
	}

	flags := make([]FeatureFlagDTO, 0, len(featureList.Items))
	for _, item := range featureList.Items {
		flags = append(flags, FeatureFlagDTO{
			Name:            item.Name,
			Description:     item.Spec.Description,
			Stage:           item.Spec.Stage,
			Owner:           item.Spec.Owner,
			Expression:      item.Spec.Expression,
			FrontendOnly:    item.Spec.FrontendOnly,
			RequiresRestart: item.Spec.RequiresRestart,
			RequiresDevMode: item.Spec.RequiresDevMode,
			HideFromDocs:    item.Spec.HideFromDocs,
		})
	}

	slices.SortFunc(flags, func(a, b FeatureFlagDTO) int {
		if a.Name < b.Name {
			return -1
		}
		if a.Name > b.Name {
			return 1
		}
		return 0
	})

	return flags, nil
}

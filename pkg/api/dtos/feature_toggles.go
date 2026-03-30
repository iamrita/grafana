package dtos

type FeatureToggleDTO struct {
	Name            string `json:"name"`
	Description     string `json:"description"`
	Stage           string `json:"stage"`
	Owner           string `json:"owner"`
	RequiresDevMode bool   `json:"requiresDevMode"`
	FrontendOnly    bool   `json:"frontendOnly"`
	RequiresRestart bool   `json:"requiresRestart"`
	Enabled         bool   `json:"enabled"`
}

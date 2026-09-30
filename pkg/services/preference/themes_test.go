package pref

import (
	"encoding/json"
	"os"
	"path/filepath"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestIsValidThemeID(t *testing.T) {
	tests := []struct {
		id    string
		valid bool
	}{
		{id: "dark", valid: true},
		{id: "light", valid: true},
		{id: "system", valid: true},
		{id: "oceanblue", valid: true},
		{id: "sapphiredusk", valid: true},
		{id: "", valid: false},
		{id: "Ocean blue", valid: false},
		{id: "does-not-exist", valid: false},
	}

	for _, tc := range tests {
		t.Run(tc.id, func(t *testing.T) {
			assert.Equal(t, tc.valid, IsValidThemeID(tc.id))
		})
	}
}

func TestGetThemeByID(t *testing.T) {
	t.Run("returns nil for unknown theme", func(t *testing.T) {
		assert.Nil(t, GetThemeByID("does-not-exist"))
	})

	t.Run("returns built-in theme", func(t *testing.T) {
		theme := GetThemeByID("light")
		require.NotNil(t, theme)
		assert.Equal(t, ThemeDTO{ID: "light", Type: "light"}, *theme)
	})

	t.Run("returns oceanblue as a dark extra theme", func(t *testing.T) {
		theme := GetThemeByID("oceanblue")
		require.NotNil(t, theme)
		assert.Equal(t, ThemeDTO{ID: "oceanblue", Type: "dark", IsExtra: true}, *theme)
	})
}

// Guards against themes_generated.go drifting from the frontend theme definitions.
func TestGeneratedThemesMatchDefinitions(t *testing.T) {
	definitionsDir := filepath.Join("..", "..", "..", "packages", "grafana-data", "src", "themes", "themeDefinitions")
	entries, err := os.ReadDir(definitionsDir)
	require.NoError(t, err)

	for _, entry := range entries {
		if entry.IsDir() || filepath.Ext(entry.Name()) != ".json" {
			continue
		}

		raw, err := os.ReadFile(filepath.Join(definitionsDir, entry.Name()))
		require.NoError(t, err)

		var def struct {
			ID     string `json:"id"`
			Colors struct {
				Mode string `json:"mode"`
			} `json:"colors"`
		}
		require.NoError(t, json.Unmarshal(raw, &def))

		theme := GetThemeByID(def.ID)
		require.NotNil(t, theme, "theme %q from %s is missing from themes_generated.go; run go generate", def.ID, entry.Name())
		assert.Equal(t, def.Colors.Mode, theme.Type, "theme %q type mismatch", def.ID)
		assert.True(t, theme.IsExtra, "theme %q should be marked as extra", def.ID)
	}
}

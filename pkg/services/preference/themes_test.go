package pref

import "testing"

func TestIsValidThemeID(t *testing.T) {
	tests := []struct {
		name     string
		themeID  string
		expected bool
	}{
		{"dark theme", "dark", true},
		{"light theme", "light", true},
		{"system theme", "system", true},
		{"bright pink theme", "brightpink", true},
		{"synthwave theme", "synthwave", true},
		{"invalid theme", "nonexistent", false},
		{"empty theme", "", false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := IsValidThemeID(tt.themeID)
			if result != tt.expected {
				t.Errorf("IsValidThemeID(%q) = %v, want %v", tt.themeID, result, tt.expected)
			}
		})
	}
}

func TestGetThemeByID(t *testing.T) {
	tests := []struct {
		name        string
		themeID     string
		expectNil   bool
		expectExtra bool
	}{
		{"dark theme", "dark", false, false},
		{"light theme", "light", false, false},
		{"bright pink theme", "brightpink", false, true},
		{"nonexistent theme", "nonexistent", true, false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			theme := GetThemeByID(tt.themeID)
			if tt.expectNil {
				if theme != nil {
					t.Errorf("GetThemeByID(%q) = %v, want nil", tt.themeID, theme)
				}
			} else {
				if theme == nil {
					t.Errorf("GetThemeByID(%q) = nil, want non-nil", tt.themeID)
				} else {
					if theme.IsExtra != tt.expectExtra {
						t.Errorf("GetThemeByID(%q).IsExtra = %v, want %v", tt.themeID, theme.IsExtra, tt.expectExtra)
					}
				}
			}
		})
	}
}

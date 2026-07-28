package git

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestIsValidGitRef(t *testing.T) {
	tests := []struct {
		name     string
		ref      string
		expected bool
	}{
		{"empty ref is valid", "", true},
		{"branch name", "feature/add-tests", true},
		{"full commit hash", "fedcba0987654321fedcba0987654321fedcba09", true},
		{"abbreviated commit hash", "fedcba0", true},
		{"invalid ref with consecutive dots", "feature..branch", false},
		{"path traversal attempt", "../../../etc/passwd", false},
		{"branch with invalid character", "feature~branch", false},
		{"ref with spaces", "feature branch", false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			assert.Equal(t, tt.expected, IsValidGitRef(tt.ref))
		})
	}
}

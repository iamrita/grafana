package setting

import (
	"os"
	"path/filepath"
	"testing"

	"github.com/stretchr/testify/require"
	"gopkg.in/ini.v1"
)

// minimalDefaultsINI provides the smallest valid defaults.ini for precedence tests.
const minimalDefaultsINI = `
[paths]
data = data
logs = data/log
plugins = data/plugins
provisioning = conf/provisioning

[server]
domain = default.example.com
http_port = 3000
protocol = http
min_tls_version = TLS1.2
root_url = %(protocol)s://%(domain)s:%(http_port)s/

[security]
admin_user = admin
admin_password = admin
secret_key = SW2YcwTIb9zpOOho3HsPjpsvgoAZxcfylzWb9

[database]
type = sqlite3
`

func setupPrecedenceTestHome(t *testing.T, customINI string) string {
	t.Helper()
	skipStaticRootValidation = true

	home := t.TempDir()
	confDir := filepath.Join(home, "conf")
	require.NoError(t, os.MkdirAll(confDir, 0o755))
	require.NoError(t, os.WriteFile(filepath.Join(confDir, "defaults.ini"), []byte(minimalDefaultsINI), 0o644))

	if customINI != "" {
		require.NoError(t, os.WriteFile(filepath.Join(confDir, "custom.ini"), []byte(customINI), 0o644))
	}

	return home
}

func loadPrecedenceConfig(t *testing.T, home string, env map[string]string, cliArgs []string) *ini.File {
	t.Helper()

	for k, v := range env {
		t.Setenv(k, v)
	}

	cfg := NewCfg()
	cfg.HomePath = home
	iniFile, err := mergeConfigLayers(cfg, CommandLineArgs{
		HomePath: home,
		Args:     cliArgs,
	})
	require.NoError(t, err)
	return iniFile
}

func TestConfigPrecedence(t *testing.T) {
	tests := []struct {
		name     string
		custom   string
		env      map[string]string
		cliArgs  []string
		section  string
		key      string
		expected string
	}{
		{
			name:     "custom.ini overrides defaults.ini for server.domain",
			custom:   "[server]\ndomain = custom.example.com\n",
			section:  "server",
			key:      "domain",
			expected: "custom.example.com",
		},
		{
			name:     "env overrides custom.ini for server.domain",
			custom:   "[server]\ndomain = custom.example.com\n",
			env:      map[string]string{"GF_SERVER_DOMAIN": "env.example.com"},
			section:  "server",
			key:      "domain",
			expected: "env.example.com",
		},
		{
			name:     "env overrides defaults.ini for security.admin_user",
			env:      map[string]string{"GF_SECURITY_ADMIN_USER": "env-admin"},
			section:  "security",
			key:      "admin_user",
			expected: "env-admin",
		},
		{
			name:     "custom.ini overrides defaults.ini for security.admin_user",
			custom:   "[security]\nadmin_user = custom-admin\n",
			section:  "security",
			key:      "admin_user",
			expected: "custom-admin",
		},
		{
			name:     "cli override wins over env for server.domain",
			custom:   "[server]\ndomain = custom.example.com\n",
			env:      map[string]string{"GF_SERVER_DOMAIN": "env.example.com"},
			cliArgs:  []string{"cfg:server.domain=cli.example.com"},
			section:  "server",
			key:      "domain",
			expected: "cli.example.com",
		},
		{
			name:     "cli default override sits between defaults and custom for server.domain",
			custom:   "[server]\ndomain = custom.example.com\n",
			cliArgs:  []string{"cfg:default.server.domain=cli-default.example.com"},
			section:  "server",
			key:      "domain",
			expected: "custom.example.com",
		},
		{
			name:     "env overrides custom for server.http_port",
			custom:   "[server]\nhttp_port = 8080\n",
			env:      map[string]string{"GF_SERVER_HTTP_PORT": "9090"},
			section:  "server",
			key:      "http_port",
			expected: "9090",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			home := setupPrecedenceTestHome(t, tt.custom)
			iniFile := loadPrecedenceConfig(t, home, tt.env, tt.cliArgs)

			section, err := iniFile.GetSection(tt.section)
			require.NoError(t, err)
			require.Equal(t, tt.expected, section.Key(tt.key).Value())
		})
	}
}

func TestConfigPrecedenceMultipleKeys(t *testing.T) {
	// Verifies that precedence layers resolve independently across multiple keys.
	customINI := `
[server]
domain = custom.example.com
http_port = 8080

[security]
admin_user = custom-admin
`
	env := map[string]string{
		"GF_SERVER_DOMAIN":       "env.example.com",
		"GF_SECURITY_ADMIN_USER": "env-admin",
	}

	home := setupPrecedenceTestHome(t, customINI)
	iniFile := loadPrecedenceConfig(t, home, env, nil)

	serverSection, err := iniFile.GetSection("server")
	require.NoError(t, err)
	require.Equal(t, "env.example.com", serverSection.Key("domain").Value(), "env should override custom for domain")
	require.Equal(t, "8080", serverSection.Key("http_port").Value(), "custom should win when env not set")

	securitySection, err := iniFile.GetSection("security")
	require.NoError(t, err)
	require.Equal(t, "env-admin", securitySection.Key("admin_user").Value(), "env should override custom for admin_user")
}

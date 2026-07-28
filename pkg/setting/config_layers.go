package setting

import (
	"fmt"
	"os"
	"path"
	"time"

	"gopkg.in/ini.v1"
)

// ConfigPrecedence documents the order in which configuration sources are applied.
// Higher layers override lower layers.
//
// The authoritative implementation is mergeConfigLayers in this package.
// Table-driven tests in config_precedence_test.go verify the precedence contract.
//
// Precedence order (lowest to highest):
//
//  1. defaults.ini
//  2. cfg:default.* command-line defaults
//  3. custom.ini (when no --config) or --config file
//  4. GF_* environment variables
//  5. cfg:* command-line overrides
//  6. ${VAR} / $__env{} / $__file{} variable expansion
//
// Example: if defaults.ini sets server.domain=default.example,
// custom.ini sets server.domain=custom.example, and GF_SERVER_DOMAIN=env.example
// is set, the resolved value is env.example.
func mergeConfigLayers(cfg *Cfg, args CommandLineArgs) (*ini.File, error) {
	defaultConfigFile := path.Join(cfg.HomePath, "conf/defaults.ini")
	cfg.configFiles = append(cfg.configFiles, defaultConfigFile)

	if _, err := os.Stat(defaultConfigFile); os.IsNotExist(err) {
		fmt.Println("Grafana-server Init Failed: Could not find config defaults, make sure homepath command line parameter is set or working directory is homepath")
		os.Exit(1)
	}

	parsedFile, err := ini.Load(defaultConfigFile)
	if err != nil {
		fmt.Printf("Failed to parse defaults.ini, %v\n", err)
		os.Exit(1)
		return nil, err
	}

	commandLineProps := cfg.getCommandLineProperties(args.Args)

	cfg.applyCommandLineDefaultProperties(commandLineProps, parsedFile)

	err = cfg.loadSpecifiedConfigFile(args.Config, parsedFile)
	if err != nil {
		err2 := cfg.initLogging(parsedFile)
		if err2 != nil {
			return nil, err2
		}
		cfg.Logger.Error(err.Error())
		os.Exit(1)
	}

	err = cfg.applyEnvVariableOverrides(parsedFile)
	if err != nil {
		return nil, err
	}

	cfg.applyCommandLineProperties(commandLineProps, parsedFile)

	err = expandConfig(parsedFile)
	if err != nil {
		return nil, err
	}

	return parsedFile, nil
}

func (cfg *Cfg) loadConfiguration(args CommandLineArgs) (*ini.File, error) {
	parsedFile, err := mergeConfigLayers(cfg, args)
	if err != nil {
		return nil, err
	}

	dataPath := valueAsString(parsedFile.Section("paths"), "data", "")
	cfg.DataPath = makeAbsolute(dataPath, cfg.HomePath)
	err = cfg.initLogging(parsedFile)
	if err != nil {
		return nil, err
	}

	cfg.Logger.Info(fmt.Sprintf("Starting %s", ApplicationName), "version", BuildVersion, "commit", BuildCommit, "branch", BuildBranch, "compiled", time.Unix(BuildStamp, 0))

	return parsedFile, err
}

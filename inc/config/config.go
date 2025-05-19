package config

import (
	"encoding/json"
	"os"
)

type Config struct {
	Env     string `json:"env"`
	Port    string `json:"port"`
	Timeout int    `json:"timeout"`
}

const (
	DefaultConfigPath  = "pkg/config.json"
	DefaultStoragePath = "pkg/storage.json"
	EnvDevelopment     = "development"
	EnvProduction      = "production"
)

func LoadConfig() (*Config, error) {
	return ParseConfigFile(DefaultConfigPath)
}

func (c *Config) GetEnv() string {
	return c.Env
}

func (c *Config) GetPort() string {
	return c.Port
}

func (c *Config) GetTimeout() int {
	return c.Timeout
}

func ParseConfigFile(filePath string) (*Config, error) {
	file, err := os.Open(filePath)
	if err != nil {
		return nil, err
	}
	defer file.Close()

	config := &Config{}
	decoder := json.NewDecoder(file)
	err = decoder.Decode(config)
	if err != nil {
		return nil, err
	}

	return config, nil
}

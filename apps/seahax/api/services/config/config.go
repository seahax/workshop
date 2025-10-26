package config

import (
	"fmt"
	"log"
	"time"

	"github.com/seahax/workshop/go/env"
)

type Config struct {
	// The timestamp when the application started.
	StartTimestamp int64 `env:"ignore"`

	// The timestamp when the application was built.
	BuildTimestamp int64

	// The commit hash of the application build.
	Commit string

	// The application environment (eg. development, production).
	Environment string

	// The hostname or IP address the application binds to.
	Hostname string `validate:"isdefault|ipv4|ipv6|hostname"`

	// The port number the application binds to.
	Port uint `validate:"required,port"`

	// The origin URL of the application.
	Origin string `validate:"required,url"`

	// The path to the static files served by the application.
	StaticPath string `validate:"required,dir"`
}

func (c Config) Address() string {
	return fmt.Sprintf("%s:%d", c.Hostname, c.Port)
}

var singleton *Config

func Get() *Config {
	if singleton == nil {
		singleton = &Config{
			StartTimestamp: time.Now().UnixMilli(),
			Environment:    "development",
		}

		if err := env.BindPrefixedEnv("APP_", singleton); err != nil {
			log.Fatalln(err)
		}
	}

	return singleton
}

// TODO: Add MongoDB client.

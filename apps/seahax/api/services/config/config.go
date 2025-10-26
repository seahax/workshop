package config

import (
	"errors"
	"fmt"
	"log"
	"os"
	"sync"
	"time"

	"github.com/go-playground/validator/v10"
	"github.com/seahax/workshop/go/env"
)

type Config struct {
	// The timestamp when the application was built.
	BuildTimestamp int64 `env:"APP_BUILD_TIMESTAMP"`

	// The timestamp when the application started.
	StartTimestamp int64

	// The commit hash of the application build.
	Commit string `env:"APP_COMMIT"`

	// The application environment (eg. development, production).
	Environment string `env:"APP_ENVIRONMENT" validate:"required,oneof=development production"`

	// The hostname or IP address the application binds to.
	Hostname string `env:"APP_HOSTNAME" validate:"isdefault|ipv4|ipv6|hostname"`

	// The port number the application binds to.
	Port uint `env:"APP_PORT" validate:"required,port"`

	// The origin URL of the application.
	Origin string `env:"APP_ORIGIN" validate:"required,url"`

	// The path to the static files served by the application.
	StaticPath string `env:"APP_STATIC_PATH" validate:"required,dir"`
}

func (c Config) Address() string {
	return fmt.Sprintf("%s:%d", c.Hostname, c.Port)
}

var Get = sync.OnceValue(func() *Config {
	now := time.Now().UnixMilli()
	cfg := &Config{
		BuildTimestamp: now,
		StartTimestamp: now,
		Environment:    "development",
	}

	if err := env.Bind(cfg); err != nil {
		log.Fatalln(err)
	}

	if err := validator.New().Struct(cfg); err != nil {
		var errs validator.ValidationErrors
		if errors.As(err, &errs) {
			for _, err := range errs {
				env := env.GetTag(cfg, err.StructField())
				log.Printf(`invalid config '%s' (%s)`, env, err.ActualTag())
			}
			os.Exit(1)
		}
	}

	return cfg
})

// TODO: Add MongoDB client.

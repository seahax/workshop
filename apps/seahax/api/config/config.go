package config

import (
	"errors"
	"fmt"
	"log/slog"
	"os"
	"sync"
	"time"

	"github.com/go-playground/validator/v10"
	"seahax.com/go/env"
	"seahax.com/go/shorthand"
)

type Config struct {
	// The timestamp when the application was built.
	BuildTimestamp int64 `env:"BUILD_TIMESTAMP"`

	// The timestamp when the application started.
	StartTimestamp int64

	// The commit hash of the application build.
	Commit string `env:"COMMIT"`

	// The application environment (eg. development, production).
	Environment string `env:"ENVIRONMENT" validate:"required,oneof=development production"`

	// The hostname or IP address the application binds to.
	Hostname string `env:"HOSTNAME" validate:"isdefault|ipv4|ipv6|hostname"`

	// The port number the application binds to.
	Port uint `env:"PORT" validate:"required,port"`

	// The origin URL of the application.
	Origin string `env:"ORIGIN" validate:"required,url"`

	// The path to the static files served by the application.
	StaticPath string `env:"STATIC_PATH" validate:"required,dir"`

	// The server bind address in "host:port" format.
	Address string

	// The logging level.
	LogLevel slog.Level `env:"LOG_LEVEL"`

	// Sentry DSN for error tracking.
	SentryDSN string `env:"SENTRY_DSN" validate:"required,url"`

	// MongoDB connection string.
	MongoURI string `env:"MONGODB_URL" validate:"required,url"`
}

var Get = sync.OnceValue(func() *Config {
	now := time.Now().UnixMilli()
	cfg := &Config{
		BuildTimestamp: now,
		StartTimestamp: now,
		LogLevel:       slog.LevelInfo,
	}
	binder := env.Binder{
		Prefix: "APP_",
	}

	shorthand.Critical(binder.Bind(cfg))

	if err := validator.New().Struct(cfg); err != nil {
		printConfigErrors(err, &binder, cfg)
		os.Exit(1)
	}

	cfg.Address = fmt.Sprintf("%s:%d", cfg.Hostname, cfg.Port)

	return cfg
})

func printConfigErrors(err error, binder *env.Binder, cfg *Config) {
	var fieldErrs validator.ValidationErrors

	if errors.As(err, &fieldErrs) {
		for _, fieldErr := range fieldErrs {
			name := binder.GetEnvName(cfg, fieldErr.StructField())
			fmt.Printf(`invalid config '%s' (%s): %v`, name, fieldErr.ActualTag(), fieldErr.Value())
		}
	} else {
		fmt.Println(err)
	}
}

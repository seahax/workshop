package main

import (
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"

	"seahax/api/config"
	"seahax/api/db"
	"seahax/api/info"
	"seahax/api/musings"
	"seahax/api/sentry"

	"seahax.com/go/api"
	"seahax.com/go/api/compress"
	"seahax.com/go/api/health"
	"seahax.com/go/api/log"
	"seahax.com/go/api/secure"
	"seahax.com/go/api/static"
)

func main() {
	// Force the program to exit when the main function returns.
	defer func() {
		if r := recover(); r != nil {
			slog.Error(fmt.Sprintf("fatal error: %v", r))
			os.Exit(1)
		}

		os.Exit(0)
	}()

	config := config.Get()

	if config.Environment == "production" {
		slog.SetDefault(slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
			Level: config.LogLevel,
		})))
	} else {
		slog.SetLogLoggerLevel(config.LogLevel)
	}

	sentry := sentry.Get()

	// Try to flush and close Sentry before exiting.
	defer func() {
		sentry.Flush(2 * time.Second)
		sentry.Close()
	}()

	app := &api.API{
		Logger: slog.Default(),
		Listening: func(url string) {
			slog.Debug(fmt.Sprintf("server is listening on %s", url))
		},
	}

	// Middleware
	app.UseMiddleware(&log.Middleware{})
	app.UseMiddleware(&secure.Middleware{
		CSPConnectSrc:                      "'self' https://auth0.seahax.com https://*.sentry.io",
		CSPImgSrc:                          "'self' data: https://*.gravatar.com https://*.wp.com https://cdn.auth0.com https://img.shields.io",
		CSPUpgradeInsecureRequestsDisabled: config.Environment == "development",
	})
	app.UseMiddleware(&compress.Middleware{})

	// Routes
	app.HandleRoute(&health.Route{
		Values: map[string]health.ValueProvider{
			"db": db.Health(),
		},
	})
	app.HandleRoute(&info.Route{
		Commit:         config.Commit,
		BuildTimestamp: config.BuildTimestamp,
		StartTimestamp: config.StartTimestamp,
		Environment:    config.Environment,
	})
	app.HandleRoute(&musings.Route{})
	app.HandleRoute(&static.Route{
		RootDir:          config.StaticPath,
		FallbackFilename: "index.html",
		Header: func(fileName string, header http.Header) {
			if strings.HasPrefix(fileName, "assets/") {
				header.Set("Cache-Control", "public, max-age=31536000, immutable")
			} else {
				header.Set("Cache-Control", "no-cache")
			}
		},
	})

	app.BindAddress(config.Address)

	signalChan := make(chan os.Signal, 1)
	signal.Notify(signalChan, syscall.SIGINT, syscall.SIGTERM)
	<-signalChan

	if errs := app.Shutdown(); errs != nil {
		slog.Error(fmt.Sprintf("%v", errs))

		for _, err := range errs {
			slog.Error(fmt.Sprintf("%v", err))
		}
	}
}

package main

import (
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"strings"
	"syscall"

	"seahax/services/config"

	"seahax.com/go/api"
	"seahax.com/go/api/middleware"
	"seahax.com/go/api/routes"
)

func main() {
	config := config.Get()
	app := &api.Api{
		Listening: func(url string) {
			slog.Info(fmt.Sprintf("Server is listening on %s", url))
		},
	}

	// Middleware
	app.Use(&middleware.Log{})
	app.Use(&middleware.Secure{
		CSPConnectSrc:                      "'self' https://auth0.seahax.com https://*.sentry.io",
		CSPImgSrc:                          "'self' data: https://*.gravatar.com https://*.wp.com https://cdn.auth0.com",
		CSPUpgradeInsecureRequestsDisabled: config.Environment == "development",
	})
	app.Use(&middleware.Compress{})

	// Routes
	app.Route(&routes.Health{})
	app.Route(&routes.Info{
		JSON: map[string]any{
			"commit":         config.Commit,
			"buildTimestamp": config.BuildTimestamp,
			"startTimestamp": config.StartTimestamp,
			"environment":    config.Environment,
		},
	})
	app.Route(&routes.Static{
		RootDir:  config.StaticPath,
		SpaIndex: "index.html",
		Header: func(header http.Header, fileName string) {
			if strings.HasPrefix(fileName, "assets/") {
				header.Set("Cache-Control", "public, max-age=31536000, immutable")
			} else {
				header.Set("Cache-Control", "no-cache")
			}
		},
	})

	app.BindAddress(config.Address())

	signalChan := make(chan os.Signal, 1)
	signal.Notify(signalChan, syscall.SIGINT, syscall.SIGTERM)
	<-signalChan

	if errs := app.Shutdown(); errs != nil {
		slog.Error(fmt.Sprintf("%v", errs))

		for _, err := range errs {
			slog.Error(fmt.Sprintf("%v", err))
		}
	}

	os.Exit(0)
}

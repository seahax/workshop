package main

import (
	"fmt"
	"os"
	"os/signal"
	"syscall"

	"seahax/api/config"
	"seahax/api/info"
	"seahax/api/musings"
	"seahax/api/static"

	"seahax.com/go/api"
	"seahax.com/go/api/compress"
	"seahax.com/go/api/health"
	"seahax.com/go/api/log"
	"seahax.com/go/api/secure"
)

func main() {
	config := config.Get()
	logger := config.Log
	app := &api.API{
		Logger: logger,
		Listening: func(url string) {
			logger.Info(fmt.Sprintf("Server is listening on %s", url))
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
	app.HandleRoute(&health.Route{})
	app.HandleRoute(&info.Route{
		Commit:         config.Commit,
		BuildTimestamp: config.BuildTimestamp,
		StartTimestamp: config.StartTimestamp,
		Environment:    config.Environment,
	})
	app.HandleRoute(&musings.Route{})
	app.HandleRoute(&static.Route{
		RootDir: config.StaticPath,
	})

	app.BindAddress(config.Address)

	signalChan := make(chan os.Signal, 1)
	signal.Notify(signalChan, syscall.SIGINT, syscall.SIGTERM)
	<-signalChan

	if errs := app.Shutdown(); errs != nil {
		logger.Error(fmt.Sprintf("%v", errs))

		for _, err := range errs {
			logger.Error(fmt.Sprintf("%v", err))
		}
	}

	os.Exit(0)
}

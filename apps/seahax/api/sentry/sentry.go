package sentry

import (
	"fmt"
	"log/slog"
	"os"
	"seahax/api/config"
	"sync"

	"github.com/getsentry/sentry-go"
)

var Get = sync.OnceValue(func() *sentry.Client {
	config := config.Get()
	err := sentry.Init(sentry.ClientOptions{
		Dsn:            config.SentryDSN,
		Environment:    config.Environment,
		SendDefaultPII: true,
	})

	if err != nil {
		slog.Error(fmt.Sprintf("sentry init failed: %s", err))
		os.Exit(1)
	}

	slog.Debug("sentry initialized successfully")

	return sentry.CurrentHub().Client()
})

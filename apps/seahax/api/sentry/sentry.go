package sentry

import (
	"fmt"
	"os"
	"seahax/api/config"
	"sync"

	"github.com/getsentry/sentry-go"
)

var Get = sync.OnceValue(func() *sentry.Client {
	config := config.Get()
	err := sentry.Init(sentry.ClientOptions{
		Dsn:         config.SentryDSN,
		Environment: config.Environment,
	})

	if err != nil {
		config.Log.Error(fmt.Sprintf("sentry init failed: %s", err))
		os.Exit(1)
	}

	config.Log.Info("sentry initialized successfully")

	return sentry.CurrentHub().Client()
})

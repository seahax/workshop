package main

import (
	"log/slog"
	"os"
	"seahax/api/internal/config"

	"github.com/getsentry/sentry-go"
	"seahax.com/go/shorthand"
)

func init() {
	logOptions := &slog.HandlerOptions{Level: config.LogLevel}

	if config.SentryDSN != "" {
		logOptions.ReplaceAttr = func(_ []string, attr slog.Attr) slog.Attr {
			// If the attribute value is an error, send it to Sentry and replace the
			// attribute with the Sentry event ID.
			if err, ok := attr.Value.Any().(error); ok {
				id := sentry.CaptureException(err)
				return slog.String("sentry_"+attr.Key, string(*id))
			}

			return attr
		}

		shorthand.Critical(sentry.Init(sentry.ClientOptions{
			Debug:          config.Environment != "production",
			Dsn:            config.SentryDSN,
			Environment:    config.Environment,
			SendDefaultPII: true,
		}))
	}

	if config.LogFormat == "json" {
		slog.SetDefault(slog.New(slog.NewJSONHandler(os.Stdout, logOptions)))
	} else {
		slog.SetDefault(slog.New(slog.NewTextHandler(os.Stdout, logOptions)))
	}
}

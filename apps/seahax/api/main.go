package main

import (
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"strings"
	"time"

	"seahax/api/internal/config"
	"seahax/api/internal/db"
	"seahax/api/internal/info"
	"seahax/api/internal/musings"

	"github.com/getsentry/sentry-go"
	"seahax.com/go/shorthand"
	"seahax.com/go/xhttp"
	"seahax.com/go/xhttp/controller/xhealth"
	"seahax.com/go/xhttp/controller/xstatic"
	"seahax.com/go/xhttp/middleware/xcompress"
	"seahax.com/go/xhttp/middleware/xlog"
	"seahax.com/go/xhttp/middleware/xsecure"
)

func main() {
	exitcode := 0

	defer func() { os.Exit(exitcode) }()
	defer sentry.Flush(10 * time.Second)
	defer shorthand.RecoverError(func(err error) {
		exitcode = 1
		slog.Error("main panic", "error", err)
	})

	handler := xhttp.NewHandler(
		info.New(),
		musings.New(),
		xhealth.New(xhealth.Options{
			Values: map[string]*xhealth.AtomicStatus{
				"db": &db.MongoDBHealth.Status,
			},
		}),
		xstatic.New(xstatic.Options{
			RootDir:          config.StaticPath,
			FallbackFileName: "index.html",
			Header: func(fileName string, header http.Header) {
				if strings.HasPrefix(fileName, "assets/") {
					header.Set("Cache-Control", "public, max-age=31536000, immutable")
				} else {
					header.Set("Cache-Control", "no-cache")
				}
			},
		}),
	)

	handler = xhttp.WithMiddleware(handler,
		xlog.Default(),
		xcompress.Default(),
		xsecure.New(xsecure.Options{
			CSPConnectSrc: "'self' https://auth0.seahax.com https://*.sentry.io",
			CSPImgSrc:     "'self' data: https://*.gravatar.com https://*.wp.com https://cdn.auth0.com https://img.shields.io",
		}),
	)

	addr, server := xhttp.Listen(&http.Server{Addr: config.Address, Handler: handler})
	slog.Debug(fmt.Sprintf("listening on http://%s", addr))

	db.MongoDBHealth.Check()

	shorthand.WaitForSignal()
	slog.Debug("shutting down")

	xhttp.Shutdown(server)
	slog.Debug("shutdown complete")
}

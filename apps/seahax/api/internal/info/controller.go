package info

import (
	"net/http"
	"seahax/api/internal/config"

	"seahax.com/go/xhttp"
)

func New() *xhttp.Controller {
	info := map[string]any{
		"commit":         config.Commit,
		"buildTimestamp": config.BuildTimestamp,
		"startTimestamp": config.StartTimestamp,
		"environment":    config.Environment,
	}

	return xhttp.SingleRoute("GET /_info", func(writer http.ResponseWriter, request *http.Request) {
		writer.Header().Set("Cache-Control", "no-cache")
		xhttp.WriteJSON(writer, request, info)
	})
}

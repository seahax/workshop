package routes

import (
	"log/slog"
	"net/http/httputil"
	"strings"

	"seahax.com/go/api"
)

type Musings struct{}

func (m *Musings) GetRoute() (string, func(*api.Context)) {
	var handler = func(ctx *api.Context) {
		errorLog := slog.NewLogLogger(ctx.Log.Handler(), slog.LevelError)
		proxy := httputil.ReverseProxy{Rewrite: rewrite, ErrorLog: errorLog}
		proxy.ServeHTTP(ctx.Response, ctx.Request)
	}

	return "/musings/", handler
}

func rewrite(request *httputil.ProxyRequest) {
	subPath := strings.TrimPrefix(request.In.URL.Path, "/musings/")
	request.Out.Host = ""
	request.Out.URL.Scheme = "https"
	request.Out.URL.Host = "publish.obsidian.md"
	request.Out.URL.Path = "/serve"
	request.Out.URL.RawQuery = "url=seahax.com/musings/" + subPath
}

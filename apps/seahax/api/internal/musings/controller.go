package musings

import (
	"log/slog"
	"net/http"
	"net/http/httputil"
	"strings"

	"seahax.com/go/xhttp"
)

func New() *xhttp.Controller {
	proxy := httputil.ReverseProxy{
		Rewrite: func(request *httputil.ProxyRequest) {
			subPath := strings.TrimPrefix(request.In.URL.Path, "/musings/")
			request.Out.Host = ""
			request.Out.URL.Scheme = "https"
			request.Out.URL.Host = "publish.obsidian.md"
			request.Out.URL.Path = "/serve"
			request.Out.URL.RawQuery = "url=seahax.com/musings/" + subPath
		},
		ErrorHandler: func(writer http.ResponseWriter, request *http.Request, err error) {
			xhttp.Logger(request).Error("proxy error", slog.Any("error", err))
			xhttp.Error(writer, http.StatusBadGateway)
		},
	}

	return xhttp.SingleRoute("/musings/", proxy.ServeHTTP)
}

package routes

import (
	"net/http"

	"seahax.com/go/api"
)

// A static file serving endpoint with optional SPA support.
type Static struct {
	Prefix   string
	Domain   string
	RootDir  string
	SpaIndex string
	Header   func(header http.Header, fileName string)
}

func (s *Static) GetRoute() (string, func(*api.Context)) {
	pattern := &api.Pattern{Domain: s.Domain, Path: s.Prefix + "/{fileName...}"}
	handler := func(ctx *api.Context) {
		if ctx.Request.Method != "GET" {
			ctx.Response.Header().Set("Allow", "GET")
			ctx.Response.Error(http.StatusMethodNotAllowed)
			return
		}

		fileName := ctx.Request.PathValue("fileName")
		onBeforeWrite := func(fileName string) {
			if s.Header != nil {
				s.Header(ctx.Response.Header(), fileName)
			}
		}
		ctx.Response.WriteFile(s.RootDir, onBeforeWrite, fileName, s.SpaIndex)
	}

	return pattern.String(), handler
}

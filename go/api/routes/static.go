package routes

import (
	"net/http"

	"seahax.com/go/api"
)

// A static file serving route with optional SPA support.
type Static struct {
	// Optional prefix for the static route pattern.
	Prefix string
	// Optional domain for the static route pattern.
	Domain string
	// The root directory from which to serve static files.
	RootDir string
	// Optional SPA index file to serve for non-existent files.
	SpaIndex string
	// Optional callback to modify response headers before serving a file.
	Header func(header http.Header, fileName string)
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

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

func (s *Static) Route() (string, func(*api.Context)) {
	pattern := &api.Pattern{Method: "GET", Domain: s.Domain, Path: s.Prefix + "/{fileName...}"}
	handler := func(c *api.Context) {
		fileName := c.Request.PathValue("fileName")
		onBeforeWrite := func(fileName string) {
			if s.Header != nil {
				s.Header(c.Response.Header(), fileName)
			}
		}
		c.Response.WriteFile(s.RootDir, onBeforeWrite, fileName, s.SpaIndex)
	}

	return pattern.String(), handler
}

package routes

import (
	"net/http"
	"strings"

	"seahax.com/defaults"
	"seahax.com/go/api"
)

// A static file serving endpoint with optional SPA support.
type Static struct {
	PatternPrefix string
	RootDir       string
	SpaIndex      string
	Header        func(header http.Header, fileName string)
}

const DefaultStaticPatternPrefix = "GET /"

func (s *Static) Route() (string, func(*api.Context)) {
	prefix := defaults.NonZeroOrDefault(s.PatternPrefix, DefaultStaticPatternPrefix)

	if !strings.ContainsAny(prefix, " \t") {
		prefix = "GET " + prefix
	}

	pattern := prefix + "/{fileName...}"
	handler := func(c *api.Context) {
		fileName := c.Request.PathValue("fileName")
		onBeforeWrite := func(fileName string) {
			if s.Header != nil {
				s.Header(c.Response.Header(), fileName)
			}
		}
		c.Response.WriteFile(s.RootDir, onBeforeWrite, fileName, s.SpaIndex)
	}

	return pattern, handler
}

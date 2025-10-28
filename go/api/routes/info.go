package routes

import (
	"seahax.com/go/api"
	"seahax.com/go/shorthand"
)

// An information route that returns static JSON data.
type Info struct {
	// Optional custom path for the info route pattern. Defaults to
	// DefaultInfoPath if empty.
	Path string
	// Optional domain for the info route pattern.
	Domain string
	// Static JSON data that the route will serve.
	JSON map[string]any
}

const DefaultInfoPath = "/_info"

func (h *Info) GetRoute() (string, func(*api.Context)) {
	pattern := &api.Pattern{Method: "GET", Domain: h.Domain, Path: shorthand.Coalesce(h.Path, DefaultInfoPath)}
	handler := func(ctx *api.Context) {
		ctx.Response.Header().Set("Cache-Control", "no-cache")
		ctx.Response.WriteJSON(h.JSON)
	}

	return pattern.String(), handler
}

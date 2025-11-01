package info

import (
	"seahax.com/go/api"
	"seahax.com/go/shorthand"
)

// An information route that returns static JSON data.
type Route struct {
	// Optional custom path for the info route pattern. Defaults to
	// DefaultInfoPath if empty.
	Path string
	// Optional domain for the info route pattern.
	Domain string
	// Static JSON data that the route will serve.
	JSON map[string]any
}

const DefaultPath = "/_info"

func (r *Route) GetRoute() (string, api.RouteHandler) {
	pattern := &api.Pattern{Method: "GET", Domain: r.Domain, Path: shorthand.Coalesce(r.Path, DefaultPath)}
	handler := func(ctx *api.Context) {
		ctx.Response.Header().Set("Cache-Control", "no-cache")
		ctx.Response.WriteJSON(r.JSON)
	}

	return pattern.String(), handler
}

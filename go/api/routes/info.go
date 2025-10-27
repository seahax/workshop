package routes

import (
	"seahax.com/go/api"
	"seahax.com/go/shorthand"
)

// An information endpoint that returns static JSON data.
type Info struct {
	Path   string
	Domain string
	JSON   map[string]any
}

const DefaultInfoPath = "/_info"

func (h *Info) Route() (string, func(*api.Context)) {
	pattern := &api.Pattern{Method: "GET", Domain: h.Domain, Path: shorthand.Coalesce(h.Path, DefaultInfoPath)}
	handler := func(ctx *api.Context) {
		ctx.Response.Header().Set("Cache-Control", "no-cache")
		ctx.Response.WriteJSON(h.JSON)
	}

	return pattern.String(), handler
}

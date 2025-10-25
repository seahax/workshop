package routes

import (
	"strings"

	"github.com/seahax/workshop/go/api"
	"github.com/seahax/workshop/go/defaults"
)

// An information endpoint that returns static JSON data.
type Info struct {
	Pattern string
	JSON    map[string]any
}

const DefaultInfoPattern = "GET /info"

func (h *Info) Route() (string, func(*api.Context)) {
	pattern := defaults.NonZeroOrDefault(h.Pattern, DefaultInfoPattern)

	if !strings.ContainsAny(pattern, " \t") {
		pattern = "GET " + pattern
	}

	handler := func(ctx *api.Context) {
		ctx.Response.Header().Set("Cache-Control", "no-cache")
		ctx.Response.WriteJSON(h.JSON)
	}

	return pattern, handler
}

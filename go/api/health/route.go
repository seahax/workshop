package health

import (
	"net/http"

	"seahax.com/go/api"
	"seahax.com/go/shorthand"
)

// A health check route.
type Route struct {
	// Optional custom path for the health route pattern. Defaults to
	// DefaultHealthPath if empty.
	Path string
	// Optional domain for the health route pattern.
	Domain string
	// Thread-safe health state.
	State *State
}

const DefaultPath = "/_health"

func (r *Route) GetRoute() *api.Route {
	pattern := api.Pattern{
		Method: "GET",
		Domain: r.Domain,
		Path:   shorthand.Coalesce(r.Path, DefaultPath),
	}

	handler := func(ctx *api.Context) {
		if r.State == nil {
			ctx.Response.WriteJSON(&Snapshot{
				Status: StatusHealthy,
				Detail: map[string]Status{},
			})
			return
		}

		snapshot := r.State.Snapshot()
		ctx.Response.Header().Set("Cache-Control", "no-cache")

		if snapshot.Status == StatusUnhealthy {
			ctx.Response.WriteHeader(http.StatusServiceUnavailable)
		}

		ctx.Response.WriteJSON(snapshot)
	}

	return &api.Route{
		Pattern: pattern.String(),
		Handler: handler,
	}
}

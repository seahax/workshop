package routes

import (
	"net/http"
	"sync"

	"seahax.com/go/api"
	"seahax.com/go/shorthand"
)

// A health check route.
type Health struct {
	// Optional custom path for the health route pattern. Defaults to
	// DefaultHealthPath if empty.
	Path string
	// Optional domain for the health route pattern.
	Domain string
	// Thread-safe health state.
	State *HealthState
}

// A serializable snapshot of the health state.
type HealthSnapshot struct {
	Status HealthStatus            `json:"status"`
	Detail map[string]HealthStatus `json:"detail"`
}

// Thread-safe health state.
type HealthState struct {
	state sync.Map
}

// Set the health status of a component (thread-safe).
func (hs *HealthState) Set(component string, status HealthStatus) {
	hs.state.Store(component, status)
}

// Get a snapshot of the current health state (thread-safe). Includes
// overall status and per-component details.
func (hs *HealthState) Snapshot() *HealthSnapshot {
	overall := StatusHealthy
	detail := map[string]HealthStatus{}

	hs.state.Range(func(key any, value any) bool {
		if k, ok := key.(string); ok {
			if v, ok := value.(HealthStatus); ok {
				overall = max(overall, v)
				detail[k] = v
			}
		}

		return true
	})

	return &HealthSnapshot{
		Status: overall,
		Detail: detail,
	}
}

type HealthStatus string

const (
	StatusUnknownHealth HealthStatus = "unknown"
	StatusHealthy       HealthStatus = "healthy"
	StatusUnhealthy     HealthStatus = "unhealthy"
)

const DefaultHealthPath = "/_health"

func (h *Health) GetRoute() (string, func(*api.Context)) {
	pattern := &api.Pattern{Method: "GET", Domain: h.Domain, Path: shorthand.Coalesce(h.Path, DefaultHealthPath)}
	handler := func(ctx *api.Context) {
		if h.State == nil {
			ctx.Response.WriteJSON(&HealthSnapshot{
				Status: StatusHealthy,
				Detail: map[string]HealthStatus{},
			})
			return
		}

		snapshot := h.State.Snapshot()
		ctx.Response.Header().Set("Cache-Control", "no-cache")

		if snapshot.Status == StatusUnhealthy {
			ctx.Response.WriteHeader(http.StatusServiceUnavailable)
		}

		ctx.Response.WriteJSON(snapshot)
	}

	return pattern.String(), handler
}

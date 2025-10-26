package routes

import (
	"net/http"
	"strings"
	"sync"

	"github.com/seahax/workshop/go/api"
	"github.com/seahax/workshop/go/defaults"
)

// A health check endpoint.
type Health struct {
	Pattern string
	State   *HealthState
}

// Current health state snapshot.
type HealthSnapshot struct {
	Status string            `json:"status"`
	Detail map[string]string `json:"detail"`
}

// Thread-safe health state data.
type HealthState struct {
	state sync.Map
}

// Set the health status of a component (thread-safe).
func (hs *HealthState) Set(component string, status status) {
	hs.state.Store(component, status)
}

// Get a snapshot of the current health state (thread-safe). Includes
// overall status and per-component details.
func (hs *HealthState) Snapshot() *HealthSnapshot {
	overall := StatusHealthy
	detail := map[string]string{}

	hs.state.Range(func(key any, value any) bool {
		if k, ok := key.(string); ok {
			if v, ok := value.(status); ok {
				overall = max(overall, v)
				detail[k] = string(v)
			}
		}

		return true
	})

	return &HealthSnapshot{
		Status: string(overall),
		Detail: detail,
	}
}

type status string

const (
	StatusUnknown   status = "unknown"
	StatusHealthy   status = "healthy"
	StatusUnhealthy status = "unhealthy"
)

const DefaultHealthPattern = "GET /_health"

func (h *Health) Route() (string, func(*api.Context)) {
	pattern := defaults.NonZeroOrDefault(h.Pattern, DefaultHealthPattern)

	if !strings.ContainsAny(pattern, " \t") {
		pattern = "GET " + pattern
	}

	handler := func(ctx *api.Context) {
		if h.State == nil {
			ctx.Response.WriteJSON(&HealthSnapshot{
				Status: string(StatusHealthy),
				Detail: make(map[string]string),
			})
			return
		}

		snapshot := h.State.Snapshot()
		ctx.Response.Header().Set("Cache-Control", "no-cache")

		if snapshot.Status == string(StatusUnhealthy) {
			ctx.Response.WriteHeader(http.StatusServiceUnavailable)
		}

		ctx.Response.WriteJSON(snapshot)
	}

	return pattern, handler
}

package xhealth

import (
	"net/http"

	"seahax.com/go/shorthand"
	"seahax.com/go/xhttp"
)

// Serve application health status. Sends 503 (Service Unavailable) responses
// when unhealthy.
type Controller struct {
	// Optional custom path for the health route pattern. Defaults to
	// DefaultHealthPath if empty.
	Path string
	// Optional domain for the health route pattern.
	Domain string
	// Thread-safe health state. This map should not be modified after
	// initialization.
	Values map[string]ValueProvider
}

// Thread-safe status value provider.
type ValueProvider interface {
	// Load the most recent health status in a thread-safe manner.
	Load() Status
}

const DefaultPath = "/_health"

func (c *Controller) RouteEntries() xhttp.RouteEntries {
	pattern := xhttp.Pattern{
		Method: "GET",
		Domain: c.Domain,
		Path:   shorthand.Coalesce(c.Path, DefaultPath),
	}

	handler := func(writer http.ResponseWriter, request *http.Request) {
		snapshot := NewSnapshot(c.Values)
		writer.Header().Set("Cache-Control", "no-cache")

		if snapshot.Status == StatusUnhealthy {
			writer.WriteHeader(http.StatusServiceUnavailable)
		}

		xhttp.WriteJSON(writer, request, snapshot)
	}

	return xhttp.SingleRoute(pattern.String(), handler)
}

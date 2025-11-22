package xhealth

import (
	"maps"
	"net/http"

	"seahax.com/go/shorthand"
	"seahax.com/go/xhttp"
)

// Health controller options.
type Options struct {
	// Optional custom path for the health route pattern. Defaults to
	// DefaultHealthPath if empty.
	Path string
	// Optional domain for the health route pattern.
	Domain string
	// Thread-safe health state. This map should not be modified after
	// initialization.
	Values map[string]*AtomicStatus
}

const DefaultPath = "/_health"

// Create a Controller that serves application health status. Sends 503
// (Service Unavailable) responses when unhealthy.
func New(options Options) *xhttp.Controller {
	values := maps.Clone(options.Values)
	pattern := xhttp.PatternString("GET", options.Domain, shorthand.Coalesce(options.Path, DefaultPath))

	return xhttp.SingleRoute(pattern, func(writer http.ResponseWriter, request *http.Request) {
		snapshot := NewSnapshot(values)
		writer.Header().Set("Cache-Control", "no-cache")

		if snapshot.Status == StatusUnhealthy {
			writer.WriteHeader(http.StatusServiceUnavailable)
		}

		xhttp.WriteJSON(writer, request, snapshot)
	})
}

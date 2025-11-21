package xhttp

import (
	"net/http"
)

// Create a new [net/http.HandlerFunc] from controllers.
func NewHandler(controllers ...Controller) http.HandlerFunc {
	mux := http.NewServeMux()

	for _, controller := range controllers {
		for _, entry := range controller.RouteEntries() {
			mux.HandleFunc(entry.Pattern, entry.Handler)
		}
	}

	return mux.ServeHTTP
}

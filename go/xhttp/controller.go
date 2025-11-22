package xhttp

import (
	"net/http"
)

// Collection of routes. Optionally set a default path prefix and domain for all
// route patterns. Optionally set middlewares to be applied to all route
// handlers.
type Controller struct {
	// Optional default domain for all route patterns.
	Domain string
	// Optional default path prefix for all route patterns.
	Prefix string
	// Optional middlewares to be applied to all route handlers.
	Middlewares []Middleware
	// Map of routes. Keys are route patterns and values are handlers.
	Routes []*Route
}

// Single pattern and handler pair.
type Route struct {
	Pattern string
	Handler http.HandlerFunc
}

// Create a simple controller with a single route.
func SingleRoute(pattern string, handler http.HandlerFunc, middlewares ...Middleware) *Controller {
	return &Controller{
		Middlewares: middlewares,
		Routes: []*Route{{
			Pattern: pattern,
			Handler: handler,
		}},
	}
}

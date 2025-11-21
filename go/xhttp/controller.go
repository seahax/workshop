package xhttp

import (
	"net/http"
	"path"

	"seahax.com/go/shorthand"
)

// Collection of routes (ie. patterns and handlers).
type Controller interface {
	RouteEntries() RouteEntries
}

// Slice of RouteEntry pointers which implements the Controller interface.
type RouteEntries []*RouteEntry

// Single pattern and handler pair.
type RouteEntry struct {
	Pattern string
	Handler http.HandlerFunc
}

func (e RouteEntries) RouteEntries() RouteEntries {
	return e
}

// Collection of routes. Optionally set a default path prefix and domain for all
// route patterns. Optionally set middlewares to be applied to all route
// handlers.
type ControllerConfig struct {
	// Optional default path prefix for all route patterns.
	Prefix string
	// Optional default domain for all route patterns.
	Domain string
	// Optional middlewares to be applied to all route handlers.
	Middlewares []Middleware
	// Map of routes. Keys are route patterns and values are handlers.
	Routes RouteMap
}

func (c *ControllerConfig) RouteEntries() RouteEntries {
	entries := make(RouteEntries, 0, len(c.Routes))

	for pattern, handler := range c.Routes {
		p := ParsePattern(pattern)
		p.Path = path.Join(c.Prefix, p.Path)
		p.Domain = shorthand.Coalesce(p.Domain, c.Domain)

		entries = append(entries, &RouteEntry{
			Pattern: p.String(),
			Handler: WithMiddleware(handler, c.Middlewares...),
		})
	}

	return entries
}

// Map of routes which implements the Controller interface. Keys are route
// patterns and values are handlers.
type RouteMap map[string]http.HandlerFunc

func (c RouteMap) RouteEntries() RouteEntries {
	entries := make(RouteEntries, 0, len(c))

	for pattern, handler := range c {
		entries = append(entries, &RouteEntry{
			Pattern: pattern,
			Handler: handler,
		})
	}

	return entries
}

// Create a RouteEntries instance with a single route.
func SingleRoute(pattern string, handler http.HandlerFunc) RouteEntries {
	return RouteEntries{
		&RouteEntry{
			Pattern: pattern,
			Handler: handler,
		},
	}
}

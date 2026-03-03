package xhttp

import (
	"maps"
	"net/http"
)

// Map of routes with pattern keys and [http.Handler] values.
type Routes map[string](http.Handler)

func NewRoutes(values ...Routes) Routes {
	routes := Routes{}

	for _, value := range values {
		routes.Add(value)
	}

	return routes
}

// Copy input routes to this [Add] map.
func (r Routes) Add(routes map[string](http.Handler)) {
	maps.Copy(r, routes)
}

// Add a route.
func (r Routes) Route(path string, handler http.Handler) {
	r[path] = handler
}

// Add a route.
func (r Routes) RouteFunc(path string, handler http.HandlerFunc) {
	r[path] = handler
}

// Get an [http.HandlerFunc] composed of all map routes.
func (r Routes) Handler() http.HandlerFunc {
	mux := http.NewServeMux()

	for path, handler := range r {
		mux.Handle(path, handler)
	}

	return mux.ServeHTTP
}

// Get an [http.HandlerFunc] composed of all map routes and wrapped in the
// provided [Middleware].
func (r Routes) HandlerWithMiddleware(middlewares ...Middleware) http.HandlerFunc {
	return WithMiddleware(r.Handler(), middlewares...)
}

// Create a [Routes] map with a single route.
func Route(path string, handler http.Handler) Routes {
	return Routes{path: handler}
}

// Create a [Routes] map with a single route.
func RouteFunc(path string, handler http.HandlerFunc) Routes {
	return Routes{path: handler}
}

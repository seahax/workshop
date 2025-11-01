package api

// Provides a single route.
type RouteProvider interface {
	GetRoute() *Route
}

type RouteHandler = func(ctx *Context)

// A single endpoint which maps a pattern to a handler function.
type Route struct {
	Pattern string
	Handler RouteHandler
}

// Returns route pattern and handler.
func (r *Route) GetRoute() *Route {
	return r
}

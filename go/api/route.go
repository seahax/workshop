package api

// Provides a single route.
type RouteProvider interface {
	GetRoute() (pattern string, handler RouteHandler)
}

type RouteHandler = func(ctx *Context)

// A single endpoint which maps a pattern to a handler function.
type Route struct {
	Pattern string
	Handler RouteHandler
}

// Returns route pattern and handler.
func (r Route) GetRoute() (pattern string, handler RouteHandler) {
	return r.Pattern, r.Handler
}

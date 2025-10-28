package api

// Something that can provide a route and is therefore routable.
type RouteProvider interface {
	GetRoute() (pattern string, handler func(*Context))
}

// A single endpoint which maps a pattern to a handler function.
type Route struct {
	Pattern string
	Handler func(*Context)
}

func (r Route) GetRoute() (string, func(*Context)) {
	return r.Pattern, r.Handler
}

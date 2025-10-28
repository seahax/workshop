package api

// A single endpoint which maps a pattern to a handler function.
type Route struct {
	Pattern string
	Handler func(*Context)
}

func (r Route) GetRoute() (string, func(*Context)) {
	return r.Pattern, r.Handler
}

package api

import (
	gopath "path"
	"sync"
)

// A group of routes with a common prefix and shared middleware.
type Group struct {
	mut         sync.Mutex
	Prefix      string
	Middlewares []Middleware
	Routes      []Routable
}

// Add a route to the group with optional route specific middleware.
func (g *Group) Route(routable Routable, middlewares ...Middleware) {
	pattern, baseHandler := routable.Route()
	handler := applyMiddlewares(middlewares, func(ctx *Context) {
		g.mut.Lock()
		groupMiddlewares := g.Middlewares
		g.mut.Unlock()

		withMiddlewares(groupMiddlewares, ctx, func() {
			baseHandler(ctx)
		})
	})
	route := &Route{Pattern: pattern, Handler: handler}
	g.Routes = append(g.Routes, route)
}

// Add a sub-group of routes to the group with optional middleware.
func (g *Group) Group(routes *Group, middlewares ...Middleware) {
	applyGroup(routes, g, middlewares)
}

// Use middleware in all requests handled by routes in this group. These will
// only be applied when a route in this group (or a sub-group) is matched.
// Middleware is executed in the order it is added.
func (g *Group) Use(middlewares ...Middleware) {
	g.mut.Lock()
	g.Middlewares = append(g.Middlewares, middlewares...)
	g.mut.Unlock()
}

func applyGroup(
	source *Group,
	target interface {
		Route(route Routable, middlewares ...Middleware)
	},
	middlewares []Middleware,
) {
	routes := source.Routes

	for _, routable := range routes {
		pattern, handler := routable.Route()
		method, domain, path := parsePattern(pattern)
		pattern = createPattern(method, domain, gopath.Join(source.Prefix, path))
		route := &Route{Pattern: pattern, Handler: handler}
		target.Route(route, middlewares...)
	}
}

package api

import (
	"path"
	"sync"
)

type GroupProvider interface {
	GetGroup() (prefix string, routes []RouteProvider)
}

// A group of routes with a common prefix and shared middleware.
type Group struct {
	mut         sync.RWMutex
	Prefix      string
	Middlewares []Middleware
	Routes      []RouteProvider
}

func (g *Group) GetGroup() (prefix string, routes []RouteProvider) {
	return g.Prefix, g.Routes
}

// Add a route to the group with optional route specific middleware.
func (g *Group) Route(routeProvider RouteProvider, middlewares ...Middleware) {
	pattern, baseHandler := routeProvider.GetRoute()
	handler := applyMiddlewares(middlewares, func(ctx *Context) {
		g.mut.RLock()
		groupMiddlewares := g.Middlewares
		g.mut.RUnlock()

		withMiddlewares(groupMiddlewares, ctx, func() {
			baseHandler(ctx)
		})
	})
	route := &Route{Pattern: pattern, Handler: handler}
	g.Routes = append(g.Routes, route)
}

// Add a sub-group of routes to the group with optional middleware.
func (g *Group) Group(groupProvider GroupProvider, middlewares ...Middleware) {
	applyGroup(groupProvider, g, middlewares)
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
	source GroupProvider,
	target interface {
		Route(route RouteProvider, middlewares ...Middleware)
	},
	middlewares []Middleware,
) {
	prefix, routes := source.GetGroup()

	for _, routable := range routes {
		patternStr, handler := routable.GetRoute()
		pattern := ParsePattern(patternStr)
		pattern.Path = path.Join(prefix, pattern.Path)
		route := &Route{Pattern: pattern.String(), Handler: handler}
		target.Route(route, middlewares...)
	}
}

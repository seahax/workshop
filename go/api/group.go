package api

import (
	"path"
	"sync"
)

// Provides a group of routes.
type GroupProvider interface {
	GetGroup() (prefix string, routes []RouteProvider)
}

// A group of routes with a common prefix and shared middleware.
type Group struct {
	mut                sync.RWMutex
	Prefix             string
	MiddlewareHandlers []MiddlewareHandler
	Routes             []*Route
}

func (g *Group) GetGroup() (prefix string, routes []*Route) {
	return g.Prefix, g.Routes
}

// Add a route to the group with optional route specific middleware.
func (g *Group) HandleRoute(routeProvider RouteProvider, middlewareProviders ...MiddlewareProvider) {
	pattern, baseHandler := routeProvider.GetRoute()
	middlewareHandlers := getMiddlewareHandlers(middlewareProviders)
	handler := applyMiddlewareHandlers(middlewareHandlers, func(ctx *Context) {
		g.mut.RLock()
		groupMiddlewares := g.MiddlewareHandlers
		g.mut.RUnlock()

		withMiddlewareHandlers(groupMiddlewares, ctx, func() {
			baseHandler(ctx)
		})
	})
	route := &Route{Pattern: pattern, Handler: handler}
	g.Routes = append(g.Routes, route)
}

// Add a sub-group of routes to the group with optional middleware.
func (g *Group) HandleGroup(groupProvider GroupProvider, middlewareProviders ...MiddlewareProvider) {
	applyGroup(groupProvider, g, middlewareProviders)
}

// Use middleware in all requests handled by routes in this group. These will
// only be applied when a route in this group (or a sub-group) is matched.
// Middleware is executed in the order it is added.
func (g *Group) Use(providers ...MiddlewareProvider) {
	middlewareHandlers := getMiddlewareHandlers(providers)
	g.mut.Lock()
	g.MiddlewareHandlers = append(g.MiddlewareHandlers, middlewareHandlers...)
	g.mut.Unlock()
}

func applyGroup(
	source GroupProvider,
	target interface {
		HandleRoute(routeProvider RouteProvider, middlewareProviders ...MiddlewareProvider)
	},
	middlewareProviders []MiddlewareProvider,
) {
	prefix, routeProviders := source.GetGroup()

	for _, routeprovider := range routeProviders {
		patternStr, handler := routeprovider.GetRoute()
		pattern := ParsePattern(patternStr)
		pattern.Path = path.Join(prefix, pattern.Path)
		route := &Route{Pattern: pattern.String(), Handler: handler}
		target.HandleRoute(route, middlewareProviders...)
	}
}

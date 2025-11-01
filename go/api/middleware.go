package api

import "seahax.com/go/shorthand"

// MiddlewareProvider is a request handler that can process requests before
// and/or after passing control to the next handler in the chain.
type MiddlewareProvider interface {
	GetMiddleware() MiddlewareHandler
}

type MiddlewareHandler func(ctx *Context, next func())

func withMiddlewareHandlers(middlewareHandlers []MiddlewareHandler, ctx *Context, final func()) {
	if len(middlewareHandlers) == 0 {
		final()
		return
	}

	middlewareHandlers[0](ctx, func() {
		withMiddlewareHandlers(middlewareHandlers[1:], ctx, final)
	})
}

func applyMiddlewareHandlers(middlewareHandlers []MiddlewareHandler, routeHandler RouteHandler) RouteHandler {
	return func(ctx *Context) {
		withMiddlewareHandlers(middlewareHandlers, ctx, func() {
			routeHandler(ctx)
		})
	}
}

func getMiddlewareHandlers(providers []MiddlewareProvider) []MiddlewareHandler {
	return shorthand.Select(providers, func(m MiddlewareProvider) MiddlewareHandler {
		return m.GetMiddleware()
	})
}

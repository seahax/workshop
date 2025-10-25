package api

import "slices"

// Middleware is a request handler that can process requests before and/or
// after passing control to the next handler in the chain.
type Middleware interface {
	Handle(ctx *Context, next func())
}

func applyMiddlewares(middlewares []Middleware, handler func(*Context)) func(*Context) {
	for _, middleware := range slices.Backward(middlewares) {
		next := handler
		handler = func(ctx *Context) {
			middleware.Handle(ctx, func() { next(ctx) })
		}
	}

	return handler
}

func withMiddlewares(middlewares []Middleware, ctx *Context, final func()) {
	if len(middlewares) == 0 {
		final()
		return
	}

	middlewares[0].Handle(ctx, func() {
		withMiddlewares(middlewares[1:], ctx, final)
	})
}

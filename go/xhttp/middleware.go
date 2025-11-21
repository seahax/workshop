package xhttp

import (
	"net/http"
	"slices"
)

// A middleware for HTTP handlers.
type Middleware interface {
	Handler() MiddlewareHandler
}

// A middleware for HTTP handlers.
type MiddlewareHandler func(writer http.ResponseWriter, request *http.Request, next http.HandlerFunc)

func (f MiddlewareHandler) Handler() MiddlewareHandler {
	return f
}

// Create a new [net/http.HandlerFunc] that applies the middlewares in order
// before calling the original handler.
func WithMiddleware(handler http.HandlerFunc, middlewares ...Middleware) http.HandlerFunc {
	for _, middleware := range slices.Backward(middlewares) {
		var next = handler

		handler = func(writer http.ResponseWriter, request *http.Request) {
			middleware.Handler()(writer, request, next)
		}
	}

	return handler
}

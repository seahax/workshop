package api

import (
	"context"
	"log/slog"
	"net/http"
)

// Context for an API request, containing request-specific data and convenience
// methods.
//
// Use the NewContext constructor to create Context instances.
type Context struct {
	// A logger specific to this request context.
	Logger *slog.Logger
	// The associated HTTP request.
	Request *http.Request
	// The associated HTTP response.
	Response *Response
}

// Create a new API request Context, and associate it with the given
// [net/http.Request] so that it can be retrieved given the same API and
// request pointers.
func NewContext(api *API, writer http.ResponseWriter, request *http.Request) *Context {
	logger := api.Logger

	if logger == nil {
		logger = slog.Default()
	}

	ctx := &Context{Logger: logger}
	ctx.Request = request.WithContext(context.WithValue(request.Context(), api, ctx))
	ctx.Response = NewResponse(logger, writer, request)

	return ctx
}

// Retrieve the api.Context from the [net/http.Request]. This will panic if the
// request was not handled by the given API instance and has no associated
// api.Context.
func GetContext(api *API, request *http.Request) *Context {
	ctx, ok := request.Context().Value(api).(*Context)

	if !ok {
		panic("request context.Context is missing api.Context value")
	}

	return ctx
}

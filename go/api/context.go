package api

import (
	"context"
	"log/slog"
	"net/http"
	"sync"
)

type Context struct {
	mut      sync.Mutex
	cleanups []func()
	// A logger specific to this request context.
	Log *slog.Logger
	// The associated HTTP request.
	Request *http.Request
	// The associated HTTP response.
	Response *Response
}

// Register a cleanup callback to be called when the response is finished.
func (c *Context) Cleanup(callback func()) {
	c.mut.Lock()
	c.cleanups = append(c.cleanups, callback)
	c.mut.Unlock()
}

func (c *Context) close() {
	c.mut.Lock()
	cleanups := c.cleanups
	c.mut.Unlock()

	for _, cleanup := range cleanups {
		cleanup()
	}
}

func getContext(api *Api, responseWriter http.ResponseWriter, request *http.Request) *Context {
	ctx, _ := request.Context().Value(api).(*Context)

	if ctx == nil {
		logHandler := api.LogHandler

		if logHandler == nil {
			logHandler = slog.Default().Handler()
		}

		ctx = &Context{}
		ctx.Log = slog.New(logHandler)
		ctx.Request = request.WithContext(context.WithValue(request.Context(), api, ctx))
		ctx.Response = &Response{
			ResponseWriter: &writer{ResponseWriter: responseWriter},
			Request:        request,
			Log:            ctx.Log,
			Cleanup:        ctx.Cleanup,
		}

		if ctx.Log == nil {
			ctx.Log = slog.Default()
		}
	}

	return ctx
}

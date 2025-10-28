package api

import (
	"context"
	"crypto/tls"
	"errors"
	"log/slog"
	"maps"
	"net"
	"net/http"
	"sync"
	"time"

	"seahax.com/go/shorthand"
)

const (
	// Default listen address (127.0.0.1:8080).
	DefaultAddr string = "127.0.0.1:8080"

	// Default read timeout (5 minutes).
	DefaultReadTimeout time.Duration = 5 * time.Minute

	// Default read header timeout (30 seconds).
	DefaultReadHeaderTimeout time.Duration = 30 * time.Second

	// Default write timeout (10 minutes).
	DefaultWriteTimeout time.Duration = 10 * time.Minute

	// Default idle timeout (5 seconds).
	DefaultIdleTimeout time.Duration = 5 * time.Second
)

// A wrapper for the Go built-in [net/http.Mux] with quality-of-life enhancements like
// non-blocking server binding, graceful shutdown, and middleware support.
type API struct {
	mut     sync.Mutex
	mux     http.ServeMux
	servers map[*http.Server]bool

	// Global middlewares applied to all requests handled by this API, even if no
	// route is matched. Middleware is executed in the order it is added.
	Middlewares []Middleware

	// Optional request Context Logger. If nil, then slog.Default() is used.
	Log *slog.Logger

	// Optional callback that is called when a listener is created.
	Listening func(url string)

	// Optional callback that is called to handle server errors. If this is nil,
	// server errors will cause a panic.
	OnServerError func(err *ServerError)
}

// Use middleware in all requests handled by this API, even if no route is
// matched. Middleware is executed in the order it is added.
func (i *API) UseMiddleware(middlewares ...Middleware) {
	i.mut.Lock()
	i.Middlewares = append(i.Middlewares, middlewares...)
	i.mut.Unlock()
}

// Add a route to the API with optional middlewares.
func (i *API) HandleRoute(routeProvider RouteProvider, middlewares ...Middleware) {
	pattern, handler := routeProvider.GetRoute()
	pattern = ParsePattern(pattern).String() // Removes duplicate slashes
	handler = applyMiddlewares(middlewares, handler)

	i.mux.HandleFunc(pattern, func(response http.ResponseWriter, request *http.Request) {
		// The [api.Context] was already created in ServeHTTP, so just retrieve it
		// from the request [context.Context].
		ctx := GetContext(i, request)
		handler(ctx)
	})
}

// Add a group of routes to the API with optional middlewares.
func (i *API) HandleGroup(groupProvider GroupProvider, middlewares ...Middleware) {
	applyGroup(groupProvider, i, middlewares)
}

// Bind this API to the given HTTP server. This function is non-blocking. This
// function will mutate the given server's fields!
//
// # Defaults
//
// Server fields will be updated as follows.
//
//   - Handler is set to the API instance.
//   - Addr is set to the final listener address.
//   - If ReadTimeout is zero, DefaultReadTimeout is used.
//   - If ReadHeaderTimeout is zero, DefaultReadHeaderTimeout is used.
//   - If WriteTimeout is zero, DefaultWriteTimeout is used.
//   - If IdleTimeout is zero, DefaultIdleTimeout is used.
//
// # Listening
//
// If Addr is empty, the listener will bind to DefaultAddr.
//
// # TLS
//
// If TLSConfig is non-nil, TLS is used.
//
// # Errors
//
// If the server fails and the API's Error field is non-nil, it will be called
// with the server and the error. If the Error field is nil, a panic will
// occur.
func (i *API) BindServer(server *http.Server) {
	server.Handler = i
	server.ReadTimeout = shorthand.Coalesce(server.ReadTimeout, DefaultReadTimeout)
	server.ReadHeaderTimeout = shorthand.Coalesce(server.ReadHeaderTimeout, DefaultReadHeaderTimeout)
	server.WriteTimeout = shorthand.Coalesce(server.WriteTimeout, DefaultWriteTimeout)
	server.IdleTimeout = shorthand.Coalesce(server.IdleTimeout, DefaultIdleTimeout)
	server.TLSNextProto = shorthand.Coalesce(server.TLSNextProto, map[string]func(*http.Server, *tls.Conn, http.Handler){})

	i.mut.Lock()
	if i.servers == nil {
		i.servers = map[*http.Server]bool{}
	}
	i.servers[server] = true
	i.mut.Unlock()

	serverError := i.OnServerError

	if serverError == nil {
		serverError = func(err *ServerError) {
			panic(err)
		}
	}

	address := shorthand.Coalesce(server.Addr, DefaultAddr)
	listener, err := net.Listen("tcp", address)

	if err != nil {
		serverError(&ServerError{err, server})
		return
	}

	server.Addr = listener.Addr().String()
	protocol := "http"

	if server.TLSConfig != nil {
		protocol = "https"
	}

	i.Listening(protocol + "://" + server.Addr)

	go func() {
		var err error

		if protocol == "http" {
			err = server.Serve(listener)
		} else {
			err = server.ServeTLS(listener, "", "")
		}

		i.mut.Lock()
		delete(i.servers, server)
		i.mut.Unlock()

		if !errors.Is(err, http.ErrServerClosed) {
			serverError(&ServerError{err, server})
		}
	}()
}

// Bind this API to a new HTTP server listening on the given address. This call
// is non-blocking.
//
// # Listening
//
// If Addr is empty, the listener will bind to DefaultAddr.
//
// # Errors
//
// If the server fails and the API's Error field is non-nil, it will be called
// with the server and the error. If the Error field is nil, a panic will
// occur.
func (i *API) BindAddress(addr string) {
	i.BindServer(&http.Server{Addr: addr})
}

// Attempt to gracefully shutdown all servers that were started by the API. If
// a server does not shutdown within 10 seconds, it will be forcibly closed.
func (i *API) Shutdown() ShutdownError {
	i.mut.Lock()
	servers := maps.Keys(i.servers)
	i.servers = map[*http.Server]bool{}
	i.mut.Unlock()

	serverChan := make(chan *ServerError)

	for server := range servers {
		go func() {
			ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
			defer cancel()

			err := server.Shutdown(ctx)

			if errors.Is(err, context.DeadlineExceeded) {
				if err := server.Close(); err != nil {
					serverChan <- &ServerError{err, server}
					return
				}
			} else if err != nil {
				serverChan <- &ServerError{err, server}
				return
			}

			serverChan <- nil
		}()
	}

	var err ShutdownError

	// Wait for all servers to shutdown.
	for range servers {
		serverError := <-serverChan

		if serverError != nil && !errors.Is(serverError, http.ErrServerClosed) {
			err = append(err, serverError)
		}
	}

	if len(err) > 0 {
		return err
	}

	return nil
}

func (i *API) ServeHTTP(writer http.ResponseWriter, request *http.Request) {
	ctx := NewContext(i, writer, request)

	defer func() {
		if err := recover(); err != nil {
			ctx.Log.Error("Panic in API handler", "error", err)

			if !ctx.Response.Written() {
				ctx.Response.Error(http.StatusInternalServerError)
			}
		}
	}()

	i.mut.Lock()
	middlewares := i.Middlewares
	i.mut.Unlock()

	withMiddlewares(middlewares, ctx, func() {
		i.mux.ServeHTTP(ctx.Response, ctx.Request)

		if !ctx.Response.Written() {
			// It's possible that the matched handler did not write any response.
			// In this case, return a 200 OK with no body by default.
			ctx.Response.WriteHeader(http.StatusOK)
		}
	})
}

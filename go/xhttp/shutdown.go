package xhttp

import (
	"context"
	"errors"
	"fmt"
	"net/http"
	"time"
)

// Gracefully shutdown [net/http.Server] instances. If a server does not
// shutdown within 10 seconds, it will be forcibly closed.
func Shutdown(servers ...*http.Server) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	ShutdownContext(ctx, servers...)
}

// Gracefully shutdown [net/http.Server] instances with the given context. All
// servers are shutdown in parallel. If the context throws a
// [context.DeadlineExceeded] error, the server will be forcibly closed.
func ShutdownContext(ctx context.Context, servers ...*http.Server) {
	serverChan := make(chan error)

	for _, server := range servers {
		go func() {
			childCtx, cancel := context.WithCancel(ctx)
			defer cancel()

			err := server.Shutdown(childCtx)

			if errors.Is(err, context.DeadlineExceeded) {
				if err := server.Close(); err != nil {
					serverChan <- fmt.Errorf("server close failed: %w", err)
					return
				}
			} else if err != nil {
				serverChan <- fmt.Errorf("server shutdown failed: %w", err)
				return
			}

			serverChan <- nil
		}()
	}

	var errs []error

	// Wait for all servers to shutdown.
	for range servers {
		err := <-serverChan

		if err != nil && !errors.Is(err, http.ErrServerClosed) {
			errs = append(errs, err)
		}
	}

	if len(errs) > 0 {
		panic(errors.Join(errs...))
	}
}

package xhttp

import (
	"errors"
	"net"
	"net/http"

	"seahax.com/go/shorthand"
)

// Listen and serve HTTP requests using the [net/http.Server]. This is
// non-blocking. Panic on listener errors and fatal server errors. Return the
// listener [net.Addr].
func Listen(server *http.Server) (net.Addr, *http.Server) {
	addr := shorthand.Coalesce(server.Addr, DefaultAddr)
	listener := shorthand.CriticalValue(net.Listen("tcp", addr))

	go func() {
		shorthand.Critical(serve(listener, server))
	}()

	return listener.Addr(), server
}

func serve(listener net.Listener, server *http.Server) error {
	var err error

	if server.TLSConfig == nil {
		err = server.Serve(listener)
	} else {
		err = server.ServeTLS(listener, "", "")
	}

	if !errors.Is(err, http.ErrServerClosed) {
		return err
	}

	return nil
}

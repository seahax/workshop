package xhttp

import (
	"errors"
	"net"
	"net/http"
)

// Listen and serve HTTP requests using the [net/http.Server]. This is
// non-blocking. Panic on listener errors and fatal server errors. Return the
// listener [net.Addr].
func Listen(server *http.Server) net.Addr {
	listener, err := net.Listen("tcp", server.Addr)

	if err != nil {
		panic(err)
	}

	go func() {
		var err error

		if server.TLSConfig == nil {
			err = server.Serve(listener)
		} else {
			err = server.ServeTLS(listener, "", "")
		}

		if !errors.Is(err, http.ErrServerClosed) {
			panic(err)
		}
	}()

	return listener.Addr()
}

// Handle HTTP requests at the address using the handler function. This is
// non-blocking. Panic on listener errors and fatal server errors. Return the
// listener [net.Addr] and the [net/http.Server].
func ListenAddr(addr string, handler http.HandlerFunc) (net.Addr, *http.Server) {
	server := NewServer()
	server.Addr = addr
	server.Handler = handler
	addrActual := Listen(server)

	return addrActual, server
}

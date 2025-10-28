package api

import (
	"fmt"
	"net/http"

	"seahax.com/go/shorthand"
)

// Returned by API.Shutdown if one or more servers failed to shutdown cleanly.
type ShutdownError []*ServerError

func (e ShutdownError) Error() string {
	return "API failed to shutdown cleanly"
}

func (e ShutdownError) Unwrap() []error {
	return shorthand.Select(e, func(v *ServerError) error { return v })
}

// Passed to the API.OnServerError callback when an [net/http.Server] fails
// that was bound to an API.
type ServerError struct {
	error
	server *http.Server
}

func (e *ServerError) Error() string {
	return fmt.Sprintf("server %s %v", e.server.Addr, e.error.Error())
}

func (e *ServerError) Server() *http.Server {
	return e.server
}

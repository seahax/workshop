package api

import (
	"fmt"
	"net/http"

	"seahax.com/go/shorthand"
)

type ShutdownError []*ServerError

func (e ShutdownError) Error() string {
	return "API failed to shutdown cleanly"
}

func (e ShutdownError) Unwrap() []error {
	return shorthand.Select(e, func(v *ServerError) error { return v })
}

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

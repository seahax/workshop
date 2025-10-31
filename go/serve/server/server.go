package server

import (
	"crypto/tls"
	"net/http"
	"strings"
	"time"
)

type ServerConfig struct {
	ReadTimeout  time.Duration
	WriteTimeout time.Duration
}

// Create a [net/http.Server] configured for this application.
func NewServer(
	addr string,
	config *ServerConfig,
	handler func(response *Response, request *http.Request),
) *http.Server {
	return &http.Server{
		Addr:         addr,
		ReadTimeout:  config.ReadTimeout,
		WriteTimeout: config.WriteTimeout,
		// Disable HTTP/2
		TLSNextProto: map[string]func(*http.Server, *tls.Conn, http.Handler){},
		Handler: http.HandlerFunc(func(baseResponse http.ResponseWriter, request *http.Request) {
			response := NewResponse(baseResponse)

			if !strings.HasPrefix(request.URL.Path, "/") {
				request.URL.Path = "/" + request.URL.Path
			}

			handler(response, request)
		}),
	}
}

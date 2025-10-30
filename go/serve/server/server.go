package server

import (
	"crypto/tls"
	"net/http"
	"strings"
	"time"
)

type ServerConfig struct {
	Addr         string
	ReadTimeout  time.Duration
	WriteTimeout time.Duration
}

func NewServer(config *ServerConfig, handler func(response *Response, request *http.Request)) *http.Server {
	return &http.Server{
		Addr:         config.Addr,
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

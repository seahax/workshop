package xhttp

import (
	"crypto/tls"
	"net/http"
	"time"
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

// Create a new [net/http.Server] with (sane?) defaults.
//   - Addr = 127.0.0.1:8080
//   - ReadTimeout = 5 minutes
//   - ReadHeaderTimeout = 30 seconds
//   - WriteTimeout = 10 minutes
//   - IdleTimeout = 5 seconds
//   - HTTP/2 disabled by default
func NewServer() *http.Server {
	return &http.Server{
		Addr:              DefaultAddr,
		ReadTimeout:       DefaultReadTimeout,
		ReadHeaderTimeout: DefaultReadHeaderTimeout,
		WriteTimeout:      DefaultWriteTimeout,
		IdleTimeout:       DefaultIdleTimeout,

		// Disables HTTP/2 by default.
		TLSNextProto: map[string]func(*http.Server, *tls.Conn, http.Handler){},
	}
}

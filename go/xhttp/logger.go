package xhttp

import (
	"log/slog"
	"net/http"

	"seahax.com/go/shorthand"
)

var loggerContextKey = shorthand.NewContextKey(slog.Default)

// Return the [log/slog.Logger] associated with the [net/http.Request]. The logger can be
// set using [xhttp.ApplyLogger].
//
// [xhttp.ApplyLogger]: https://pkg.go.dev/seahax.com/go/xhttp#ApplyLogger
func Logger(request *http.Request) *slog.Logger {
	return loggerContextKey.Value(request.Context())
}

// Associate the [log/slog.Logger] with the [net/http.Request]. The logger can
// be retrieved later using [xhttp.Logger].
//
// [xhttp.Logger]: https://pkg.go.dev/seahax.com/go/xhttp#Logger
func ApplyLogger(request *http.Request, logger *slog.Logger) *http.Request {
	return request.WithContext(loggerContextKey.ApplyValue(request.Context(), logger))
}

package xhttp

import (
	"log/slog"
)

var loggerRequestContext = NewRequestContext("logger", slog.Default)

// Return the [log/slog.Logger] associated with the [net/http.Request].
var Logger = loggerRequestContext.Value

// Associate the [log/slog.Logger] with the [net/http.Request].
var WithLogger = loggerRequestContext.WithValue

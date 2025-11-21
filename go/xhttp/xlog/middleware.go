package xlog

import (
	"log/slog"
	"net/http"
	"time"

	"seahax.com/go/shorthand"
	"seahax.com/go/xhttp"
)

// Attach a logger to incoming HTTP requests and write access logs for each
// request.
type Middleware struct {
	// Custom logger to attach to incoming requests.
	Logger *slog.Logger

	// Get attributes included in all log entries (not just request logs).
	Attrs func(request *http.Request) []slog.Attr

	// If true, access logging is disabled. Defaults to false which enables
	// access logging.
	AccessLogDisabled bool
	// URL attribute name. If empty, DefaultURLAttr is used. If "-", the
	// attribute is not logged.
	AttrURL string
	// Method attribute name. If empty, DefaultMethodAttr is used. If "-", the
	// attribute is not logged.
	AttrMethod string
	// Remote address attribute name. If empty, DefaultRemoteAddrAttr is used. If
	// "-", the attribute is not logged.
	AttrRemoteAddr string
	// Referer attribute name. If empty, DefaultRefererAttr is used. If "-", the
	// attribute is not logged.
	AttrReferer string
	// User agent attribute name. If empty, DefaultUserAgentAttr is used. If "-",
	// the attribute is not logged.
	AttrUserAgent string
	// HTTP version attribute name. If empty, DefaultHTTPVersionAttr is used. If
	// "-", the attribute is not logged.
	AttrHTTPVersion string
	// Response type attribute name. If empty, DefaultResponseTypeAttr is used.
	// If "-", the attribute is not logged.
	AttrResponseType string
	// Response status attribute name. If empty, DefaultResponseStatusAttr is
	// used. If "-", the attribute is not logged.
	AttrResponseStatus string
	// Response time attribute name. If empty, DefaultResponseTimeAttr is used.
	// If "-", the attribute is not logged.
	AttrResponseTime string
	// Total time attribute name. If empty, DefaultTotalTimeAttr is used. If "-",
	// the attribute is not logged.
	AttrTotalTime string
}

const (
	DefaultURLAttr            = "url"
	DefaultMethodAttr         = "method"
	DefaultRemoteAddrAttr     = "remote_addr"
	DefaultRefererAttr        = "referer"
	DefaultUserAgentAttr      = "user_agent"
	DefaultHTTPVersionAttr    = "http_version"
	DefaultResponseTypeAttr   = "response_type"
	DefaultResponseStatusAttr = "response_status"
	DefaultResponseTimeAttr   = "response_time"
	DefaultTotalTimeAttr      = "total_time"
)

func (m *Middleware) Handler() xhttp.MiddlewareHandler {
	return func(writer http.ResponseWriter, request *http.Request, next http.HandlerFunc) {
		handle(m, writer, request, next)
	}
}

func handle(config *Middleware, writer http.ResponseWriter, request *http.Request, next http.HandlerFunc) {
	startTimestamp := time.Now().UnixMilli()
	originalLogger := xhttp.Logger(request)
	logger := shorthand.Coalesce(config.Logger, originalLogger)

	if config.Attrs != nil {
		attrs := config.Attrs(request)

		if len(attrs) > 0 {
			logger = slog.New(logger.Handler().WithAttrs(attrs))
		}
	}

	if logger != originalLogger {
		request = xhttp.WithLogger(request, logger)
	}

	if !config.AccessLogDisabled {
		var status int
		var headerTimestamp int64

		writer = xhttp.WithBeforeWriteCallback(writer, func(newStatus int) {
			headerTimestamp = time.Now().UnixMilli()
			status = newStatus
		})

		defer func() {
			attrs := []slog.Attr{}
			attrs = appendAttr(attrs, config.AttrURL, DefaultURLAttr, func(name string) slog.Attr {
				return slog.String(name, request.URL.String())
			})
			attrs = appendAttr(attrs, config.AttrMethod, DefaultMethodAttr, func(name string) slog.Attr {
				return slog.String(name, request.Method)
			})
			attrs = appendAttr(attrs, config.AttrRemoteAddr, DefaultRemoteAddrAttr, func(name string) slog.Attr {
				return slog.String(name, request.RemoteAddr)
			})
			attrs = appendAttr(attrs, config.AttrReferer, DefaultRefererAttr, func(name string) slog.Attr {
				return slog.String(name, request.Referer())
			})
			attrs = appendAttr(attrs, config.AttrUserAgent, DefaultUserAgentAttr, func(name string) slog.Attr {
				return slog.String(name, request.UserAgent())
			})
			attrs = appendAttr(attrs, config.AttrHTTPVersion, DefaultHTTPVersionAttr, func(name string) slog.Attr {
				return slog.String(name, request.Proto)
			})
			attrs = appendAttr(attrs, config.AttrResponseStatus, DefaultResponseStatusAttr, func(name string) slog.Attr {
				return slog.Int(name, status)
			})
			attrs = appendAttr(attrs, config.AttrResponseType, DefaultResponseTypeAttr, func(name string) slog.Attr {
				return slog.String(name, writer.Header().Get("Content-Type"))
			})
			attrs = appendAttr(attrs, config.AttrResponseTime, DefaultResponseTimeAttr, func(name string) slog.Attr {
				return slog.Int64(name, max(headerTimestamp-startTimestamp, 0))
			})
			attrs = appendAttr(attrs, config.AttrTotalTime, DefaultTotalTimeAttr, func(name string) slog.Attr {
				return slog.Int64(name, time.Now().UnixMilli()-startTimestamp)
			})
			logger.LogAttrs(request.Context(), slog.LevelInfo, "incoming request", attrs...)
		}()
	}

	next(writer, request)
}

func appendAttr(attrs []slog.Attr, name string, defaultName string, provider func(name string) slog.Attr) []slog.Attr {
	if name == "-" {
		return attrs
	}

	name = shorthand.Coalesce(name, defaultName)

	return append(attrs, provider(name))
}

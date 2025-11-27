package xlog

import (
	"log/slog"
	"net/http"
	"time"

	"seahax.com/go/shorthand"
	"seahax.com/go/xhttp"
)

// Logging middleware options.
type Options struct {
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

// Create a middleware that attaches a logger to incoming HTTP requests and
// writes access logs for each request.
func New(options Options) xhttp.Middleware {
	return func(writer http.ResponseWriter, request *http.Request, next http.HandlerFunc) {
		handle(&options, writer, request, next)
	}
}

var defaultMiddleware xhttp.Middleware

func init() {
	defaultMiddleware = New(Options{})
}

// Get the default logging middleware. All options are defaulted.
func Default() xhttp.Middleware {
	return defaultMiddleware
}

func handle(options *Options, writer http.ResponseWriter, request *http.Request, next http.HandlerFunc) {
	startTimestamp := time.Now().UnixMilli()
	originalLogger := xhttp.Logger(request)
	logger := shorthand.Coalesce(options.Logger, originalLogger)

	if options.Attrs != nil {
		attrs := options.Attrs(request)

		if len(attrs) > 0 {
			logger = slog.New(logger.Handler().WithAttrs(attrs))
		}
	}

	if logger != originalLogger {
		request = xhttp.WithLogger(request, logger)
	}

	if !options.AccessLogDisabled {
		var status int
		var headerTimestamp int64

		writer = xhttp.WithBeforeWriteCallback(writer, func(newStatus int) {
			headerTimestamp = time.Now().UnixMilli()
			status = newStatus
		})

		defer func() {
			attrs := []slog.Attr{}
			attrs = appendAttr(attrs, options.AttrURL, DefaultURLAttr, func(name string) slog.Attr {
				return slog.String(name, request.URL.String())
			})
			attrs = appendAttr(attrs, options.AttrMethod, DefaultMethodAttr, func(name string) slog.Attr {
				return slog.String(name, request.Method)
			})
			attrs = appendAttr(attrs, options.AttrRemoteAddr, DefaultRemoteAddrAttr, func(name string) slog.Attr {
				return slog.String(name, request.RemoteAddr)
			})
			attrs = appendAttr(attrs, options.AttrReferer, DefaultRefererAttr, func(name string) slog.Attr {
				return slog.String(name, request.Referer())
			})
			attrs = appendAttr(attrs, options.AttrUserAgent, DefaultUserAgentAttr, func(name string) slog.Attr {
				return slog.String(name, request.UserAgent())
			})
			attrs = appendAttr(attrs, options.AttrHTTPVersion, DefaultHTTPVersionAttr, func(name string) slog.Attr {
				return slog.String(name, request.Proto)
			})
			attrs = appendAttr(attrs, options.AttrResponseStatus, DefaultResponseStatusAttr, func(name string) slog.Attr {
				return slog.Int(name, status)
			})
			attrs = appendAttr(attrs, options.AttrResponseType, DefaultResponseTypeAttr, func(name string) slog.Attr {
				return slog.String(name, writer.Header().Get("Content-Type"))
			})
			attrs = appendAttr(attrs, options.AttrResponseTime, DefaultResponseTimeAttr, func(name string) slog.Attr {
				return slog.Int64(name, max(headerTimestamp-startTimestamp, 0))
			})
			attrs = appendAttr(attrs, options.AttrTotalTime, DefaultTotalTimeAttr, func(name string) slog.Attr {
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

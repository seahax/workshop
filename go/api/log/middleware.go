package log

import (
	"log/slog"
	"regexp"
	"strings"
	"time"

	"seahax.com/go/api"
	"seahax.com/go/shorthand"
)

// Log requests and include request headers in all log entries.
type Middleware struct {
	// Request headers to be included in all log entries (not just request logs).
	Headers []string
	// If true, request logging is disabled.
	RequestDisabled bool
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

var rxNonAlphaNumeric = regexp.MustCompile("[^a-z0-9]+")

func (m *Middleware) GetMiddleware() api.MiddlewareHandler {
	return func(ctx *api.Context, next func()) {
		startTimestamp := time.Now().UnixMilli()

		if len(m.Headers) > 0 {
			attrs := shorthand.Select(m.Headers, func(header string) slog.Attr {
				name := rxNonAlphaNumeric.ReplaceAllString(strings.ToLower(header), "_")
				return slog.String(name, ctx.Request.Header.Get(header))
			})

			ctx.Logger = slog.New(ctx.Logger.Handler().WithAttrs(attrs))
		}

		if !m.RequestDisabled {
			var status int
			var headerTimestamp int64

			ctx.Response.RegisterOnBeforeWriteHeader(func(newStatus int) {
				headerTimestamp = time.Now().UnixMilli()
				status = newStatus
			})

			defer func() {
				attrs := []slog.Attr{}
				attrs = appendAttr(attrs, m.AttrURL, DefaultURLAttr, func(name string) slog.Attr {
					return slog.String(name, ctx.Request.URL.String())
				})
				attrs = appendAttr(attrs, m.AttrMethod, DefaultMethodAttr, func(name string) slog.Attr {
					return slog.String(name, ctx.Request.Method)
				})
				attrs = appendAttr(attrs, m.AttrRemoteAddr, DefaultRemoteAddrAttr, func(name string) slog.Attr {
					return slog.String(name, ctx.Request.RemoteAddr)
				})
				attrs = appendAttr(attrs, m.AttrReferer, DefaultRefererAttr, func(name string) slog.Attr {
					return slog.String(name, ctx.Request.Referer())
				})
				attrs = appendAttr(attrs, m.AttrUserAgent, DefaultUserAgentAttr, func(name string) slog.Attr {
					return slog.String(name, ctx.Request.UserAgent())
				})
				attrs = appendAttr(attrs, m.AttrHTTPVersion, DefaultHTTPVersionAttr, func(name string) slog.Attr {
					return slog.String(name, ctx.Request.Proto)
				})
				attrs = appendAttr(attrs, m.AttrResponseStatus, DefaultResponseStatusAttr, func(name string) slog.Attr {
					return slog.Int(name, status)
				})
				attrs = appendAttr(attrs, m.AttrResponseType, DefaultResponseTypeAttr, func(name string) slog.Attr {
					return slog.String(name, ctx.Response.Header().Get("Content-Type"))
				})
				attrs = appendAttr(attrs, m.AttrResponseTime, DefaultResponseTimeAttr, func(name string) slog.Attr {
					return slog.Int64(name, max(headerTimestamp-startTimestamp, 0))
				})
				attrs = appendAttr(attrs, m.AttrTotalTime, DefaultTotalTimeAttr, func(name string) slog.Attr {
					return slog.Int64(name, time.Now().UnixMilli()-startTimestamp)
				})
				ctx.Logger.LogAttrs(ctx.Request.Context(), slog.LevelInfo, "incoming request", attrs...)
			}()
		}

		next()
	}
}

func appendAttr(attrs []slog.Attr, name string, defaultName string, provider func(name string) slog.Attr) []slog.Attr {
	if name == "-" {
		return attrs
	}

	name = shorthand.Coalesce(name, defaultName)

	return append(attrs, provider(name))
}

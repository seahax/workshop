package middleware

import (
	"log/slog"
	"regexp"
	"strings"
	"time"

	"seahax.com/go/api"
	"seahax.com/go/shorthand"
)

// Log requests and include request headers in all log entries.
type Log struct {
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

func (l *Log) Handle(ctx *api.Context, next func()) {
	start := time.Now().UnixMilli()

	if len(l.Headers) > 0 {
		attrs := shorthand.Select(l.Headers, func(header string) slog.Attr {
			name := rxNonAlphaNumeric.ReplaceAllString(strings.ToLower(header), "_")
			return slog.String(name, ctx.Request.Header.Get(header))
		})

		ctx.Log = slog.New(ctx.Log.Handler().WithAttrs(attrs))
	}

	if !l.RequestDisabled {
		defer func() {
			attrs := []slog.Attr{}
			attrs = appendAttr(attrs, l.AttrURL, DefaultURLAttr, func(name string) slog.Attr {
				return slog.String(name, ctx.Request.URL.String())
			})
			attrs = appendAttr(attrs, l.AttrMethod, DefaultMethodAttr, func(name string) slog.Attr {
				return slog.String(name, ctx.Request.Method)
			})
			attrs = appendAttr(attrs, l.AttrRemoteAddr, DefaultRemoteAddrAttr, func(name string) slog.Attr {
				return slog.String(name, ctx.Request.RemoteAddr)
			})
			attrs = appendAttr(attrs, l.AttrReferer, DefaultRefererAttr, func(name string) slog.Attr {
				return slog.String(name, ctx.Request.Referer())
			})
			attrs = appendAttr(attrs, l.AttrUserAgent, DefaultUserAgentAttr, func(name string) slog.Attr {
				return slog.String(name, ctx.Request.UserAgent())
			})
			attrs = appendAttr(attrs, l.AttrHTTPVersion, DefaultHTTPVersionAttr, func(name string) slog.Attr {
				return slog.String(name, ctx.Request.Proto)
			})
			attrs = appendAttr(attrs, l.AttrResponseStatus, DefaultResponseStatusAttr, func(name string) slog.Attr {
				return slog.Int(name, ctx.Response.Status())
			})
			attrs = appendAttr(attrs, l.AttrResponseType, DefaultResponseTypeAttr, func(name string) slog.Attr {
				return slog.String(name, ctx.Response.Header().Get("Content-Type"))
			})
			attrs = appendAttr(attrs, l.AttrResponseTime, DefaultResponseTimeAttr, func(name string) slog.Attr {
				return slog.Int64(name, max(ctx.Response.WriteHeaderTime()-start, 0))
			})
			attrs = appendAttr(attrs, l.AttrTotalTime, DefaultTotalTimeAttr, func(name string) slog.Attr {
				return slog.Int64(name, time.Now().UnixMilli()-start)
			})
			ctx.Log.LogAttrs(ctx.Request.Context(), slog.LevelInfo, "incoming request", attrs...)
		}()
	}

	next()
}

func appendAttr(attrs []slog.Attr, name string, defaultName string, provider func(name string) slog.Attr) []slog.Attr {
	if name == "-" {
		return attrs
	}

	if name == "" {
		name = defaultName
	}

	return append(attrs, provider(name))
}

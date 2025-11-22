package xsecure

import (
	"net/http"
	"strings"

	"seahax.com/go/shorthand"
	"seahax.com/go/xhttp"
)

// Security middleware options.
type Options struct {
	// If true, the Content-Security-Policy header is not added.
	CSPDisabled bool
	// CSP default-src directive value. If empty, DefaultCSPDefaultSrc is used.
	// If "-", policy is not set.
	CSPDefaultSrc string
	// CSP script-src directive value. If empty, DefaultCSPScriptSrc is used. If
	// "-", policy is not set.
	CSPScriptSrc string
	// CSP script-src-attr directive value. If empty, DefaultCSPScriptSrcAttr is
	// used. If "-", policy is not set.
	CSPScriptSrcAttr string
	// CSP style-src directive value. If empty, DefaultCSPStyleSrc is used. If
	// "-", policy is not set.
	CSPStyleSrc string
	// CSP style-src-attr directive value. Not added by default.
	CSPStyleSrcAttr string
	// CSP style-src-elem directive value. Not added by default.
	CSPStyleSrcElem string
	// CSP img-src directive value. If empty, DefaultCSPImgSrc is used. If "-",
	// policy is not set.
	CSPImgSrc string
	// CSP font-src directive value. If empty, DefaultCSPFontSrc is used. If "-",
	// policy is not set.
	CSPFontSrc string
	// CSP object-src directive value. If empty, DefaultCSPObjectSrc is used. If
	// "-", policy is not set.
	CSPObjectSrc string
	// CSP child-src directive value. Not added by default.
	CSPChildSrc string
	// CSP connect-src directive value. Not added by default.
	CSPConnectSrc string
	// CSP manifest-src directive value. Not added by default.
	CSPManifestSrc string
	// CSP media-src directive value. Not added by default.
	CSPMediaSrc string
	// CSP worker-src directive value. Not added by default.
	CSPWorkerSrc string
	// CSP base-uri directive value. If empty, DefaultCSPBaseURI is used. If "-",
	// policy is not set.
	CSPBaseURI string
	// CSP form-action directive value. If empty, DefaultCSPFormAction is used.
	// If "-", policy is not set.
	CSPFormAction string
	// CSP frame-ancestors directive value. If empty, DefaultCSPFrameAncestors is
	// used. If "-", policy is not set.
	CSPFrameAncestors string
	// If true, the CSP upgrade-insecure-requests directive is added.
	CSPUpgradeInsecureRequests bool
	// Cross-Origin-Embedder-Policy header value. Not added by default.
	CrossOriginEmbedderPolicy string
	// Cross-Origin-Opener-Policy header value. If empty,
	// DefaultCrossOriginOpenerPolicy is used. If "-", header is not set.
	CrossOriginOpenerPolicy string
	// Cross-Origin-Resource-Policy header value. If empty,
	// DefaultCrossOriginResourcePolicy is used. If "-", header is not set.
	CrossOriginResourcePolicy string
	// Origin-Agent-Cluster header value. If empty, DefaultOriginAgentCluster
	// is used. If "-", header is not set.
	OriginAgentCluster string
	// Referrer-Policy header value. If empty, DefaultReferrerPolicy is used.
	// If "-", header is not set.
	ReferrerPolicy string
	// Strict-Transport-Security header value. If empty,
	// DefaultStrictTransportSecurity is used. If "-", header is not set.
	StrictTransportSecurity string
	// X-Content-Type-Options header value. If empty, DefaultXContentTypeOptions
	// is used. If "-", header is not set.
	XContentTypeOptions string
	// X-DNS-Prefetch-Control header value. If empty, DefaultXDNSPrefetchControl
	// is used. If "-", header is not set.
	XDNSPrefetchControl string
	// X-Download-Options header value. If empty, DefaultXDownloadOptions is used.
	// If "-", header is not set.
	XDownloadOptions string
	// X-Frame-Options header value. If empty, DefaultXFrameOptions is used. If "-",
	// header is not set.
	XFrameOptions string
	// X-Permitted-Cross-Domain-Policies header value. If empty,
	// DefaultXPermittedCrossDomainPolicies is used. If "-", header is not set.
	XPermittedCrossDomainPolicies string
	// X-XSS-Protection header value. If empty, DefaultXXSSProtection is used.
	// If "-", header is not set.
	XXSSProtection string
	// If true, the X-Powered-By header is NOT removed.
	XPoweredByEnabled bool
}

const (
	DefaultCSPDefaultSrc                 = "'self'"
	DefaultCSPBaseURI                    = "'self'"
	DefaultCSPFontSrc                    = "'self' https: data:"
	DefaultCSPFormAction                 = "'self'"
	DefaultCSPFrameAncestors             = "'self'"
	DefaultCSPImgSrc                     = "'self' data:"
	DefaultCSPObjectSrc                  = "'none'"
	DefaultCSPScriptSrc                  = "'self'"
	DefaultCSPScriptSrcAttr              = "'none'"
	DefaultCSPStyleSrc                   = "'self' https: 'unsafe-inline'"
	DefaultCrossOriginOpenerPolicy       = "same-origin"
	DefaultCrossOriginResourcePolicy     = "same-origin"
	DefaultOriginAgentCluster            = "?1"
	DefaultReferrerPolicy                = "no-referrer"
	DefaultStrictTransportSecurity       = "max-age=31536000; includeSubDomains"
	DefaultXContentTypeOptions           = "nosniff"
	DefaultXDNSPrefetchControl           = "off"
	DefaultXDownloadOptions              = "noopen"
	DefaultXFrameOptions                 = "SAMEORIGIN"
	DefaultXPermittedCrossDomainPolicies = "none"
	DefaultXXSSProtection                = "0"
)

// Create a Middleware that adds security-related HTTP headers to responses.
func New(options Options) xhttp.Middleware {
	return func(writer http.ResponseWriter, request *http.Request, next http.HandlerFunc) {
		writer = xhttp.WithBeforeWriteCallback(writer, func(_ int) {
			updateHeaders(&options, writer.Header())
		})

		next(writer, request)
	}
}

var defaultMiddleware xhttp.Middleware

func init() {
	defaultMiddleware = New(Options{})
}

// Get the default security middleware. All options are defaulted.
func Default() xhttp.Middleware {
	return defaultMiddleware
}

func updateHeaders(options *Options, header http.Header) {
	if header.Get("Content-Security-Policy") == "" && !options.CSPDisabled {
		csp := []string{}

		if options.CSPDefaultSrc != "-" {
			csp = append(csp, "default-src "+shorthand.Coalesce(options.CSPDefaultSrc, DefaultCSPDefaultSrc))
		}

		if options.CSPScriptSrc != "-" {
			csp = append(csp, "script-src "+shorthand.Coalesce(options.CSPScriptSrc, DefaultCSPScriptSrc))
		}

		if options.CSPScriptSrcAttr != "-" {
			csp = append(csp, "script-src-attr "+shorthand.Coalesce(options.CSPScriptSrcAttr, DefaultCSPScriptSrcAttr))
		}

		if options.CSPStyleSrc != "-" {
			csp = append(csp, "style-src "+shorthand.Coalesce(options.CSPStyleSrc, DefaultCSPStyleSrc))
		}

		if options.CSPStyleSrcAttr != "-" && options.CSPStyleSrcAttr != "" {
			csp = append(csp, "style-src-attr "+options.CSPStyleSrcAttr)
		}

		if options.CSPStyleSrcElem != "-" && options.CSPStyleSrcElem != "" {
			csp = append(csp, "style-src-elem "+options.CSPStyleSrcElem)
		}

		if options.CSPImgSrc != "-" {
			csp = append(csp, "img-src "+shorthand.Coalesce(options.CSPImgSrc, DefaultCSPImgSrc))
		}

		if options.CSPFontSrc != "-" {
			csp = append(csp, "font-src "+shorthand.Coalesce(options.CSPFontSrc, DefaultCSPFontSrc))
		}

		if options.CSPObjectSrc != "-" {
			csp = append(csp, "object-src "+shorthand.Coalesce(options.CSPObjectSrc, DefaultCSPObjectSrc))
		}

		if options.CSPChildSrc != "-" && options.CSPChildSrc != "" {
			csp = append(csp, "child-src "+options.CSPChildSrc)
		}

		if options.CSPConnectSrc != "-" {
			csp = append(csp, "connect-src "+options.CSPConnectSrc)
		}

		if options.CSPManifestSrc != "-" && options.CSPManifestSrc != "" {
			csp = append(csp, "manifest-src "+options.CSPManifestSrc)
		}

		if options.CSPMediaSrc != "-" && options.CSPMediaSrc != "" {
			csp = append(csp, "media-src "+options.CSPMediaSrc)
		}

		if options.CSPWorkerSrc != "-" && options.CSPWorkerSrc != "" {
			csp = append(csp, "worker-src "+options.CSPWorkerSrc)
		}

		if options.CSPBaseURI != "-" {
			csp = append(csp, "base-uri "+shorthand.Coalesce(options.CSPBaseURI, DefaultCSPBaseURI))
		}

		if options.CSPFormAction != "-" {
			csp = append(csp, "form-action "+shorthand.Coalesce(options.CSPFormAction, DefaultCSPFormAction))
		}

		if options.CSPFrameAncestors != "-" {
			csp = append(csp, "frame-ancestors "+shorthand.Coalesce(options.CSPFrameAncestors, DefaultCSPFrameAncestors))
		}

		if options.CSPUpgradeInsecureRequests {
			csp = append(csp, "upgrade-insecure-requests")
		}

		if len(csp) > 0 {
			header.Set("Content-Security-Policy", strings.Join(csp, ";"))
		}
	}

	if header.Get("Cross-Origin-Embedder-Policy") == "" && options.CrossOriginEmbedderPolicy != "-" && options.CrossOriginEmbedderPolicy != "" {
		header.Set("Cross-Origin-Embedder-Policy", options.CrossOriginEmbedderPolicy)
	}

	if header.Get("Cross-Origin-Opener-Policy") == "" && options.CrossOriginOpenerPolicy != "-" {
		header.Set("Cross-Origin-Opener-Policy", shorthand.Coalesce(options.CrossOriginOpenerPolicy, DefaultCrossOriginOpenerPolicy))
	}

	if header.Get("Cross-Origin-Resource-Policy") == "" && options.CrossOriginResourcePolicy != "-" {
		header.Set("Cross-Origin-Resource-Policy", shorthand.Coalesce(options.CrossOriginResourcePolicy, DefaultCrossOriginResourcePolicy))
	}

	if header.Get("Origin-Agent-Cluster") == "" && options.OriginAgentCluster != "-" {
		header.Set("Origin-Agent-Cluster", shorthand.Coalesce(options.OriginAgentCluster, DefaultOriginAgentCluster))
	}

	if header.Get("Referrer-Policy") == "" && options.ReferrerPolicy != "-" {
		header.Set("Referrer-Policy", shorthand.Coalesce(options.ReferrerPolicy, DefaultReferrerPolicy))
	}

	if header.Get("Strict-Transport-Security") == "" && options.StrictTransportSecurity != "-" {
		header.Set("Strict-Transport-Security", shorthand.Coalesce(options.StrictTransportSecurity, DefaultStrictTransportSecurity))
	}

	if header.Get("X-Content-Type-Options") == "" && options.XContentTypeOptions != "-" {
		header.Set("X-Content-Type-Options", shorthand.Coalesce(options.XContentTypeOptions, DefaultXContentTypeOptions))
	}

	if header.Get("X-DNS-Prefetch-Control") == "" && options.XDNSPrefetchControl != "-" {
		header.Set("X-DNS-Prefetch-Control", shorthand.Coalesce(options.XDNSPrefetchControl, DefaultXDNSPrefetchControl))
	}

	if header.Get("X-Download-Options") == "" && options.XDownloadOptions != "-" {
		header.Set("X-Download-Options", shorthand.Coalesce(options.XDownloadOptions, DefaultXDownloadOptions))
	}

	if header.Get("X-Frame-Options") == "" && options.XFrameOptions != "-" {
		header.Set("X-Frame-Options", shorthand.Coalesce(options.XFrameOptions, DefaultXFrameOptions))
	}

	if header.Get("X-Permitted-Cross-Domain-Policies") == "" && options.XPermittedCrossDomainPolicies != "-" {
		header.Set("X-Permitted-Cross-Domain-Policies", shorthand.Coalesce(options.XPermittedCrossDomainPolicies, DefaultXPermittedCrossDomainPolicies))
	}

	if header.Get("X-XSS-Protection") == "" && options.XXSSProtection != "-" {
		header.Set("X-XSS-Protection", shorthand.Coalesce(options.XXSSProtection, DefaultXXSSProtection))
	}

	if !options.XPoweredByEnabled {
		header.Del("X-Powered-By")
	}
}

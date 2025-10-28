package middleware

import (
	"net/http"
	"strings"

	"seahax.com/go/api"
	"seahax.com/go/shorthand"
)

// Add security-related HTTP headers to responses.
type Secure struct {
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
	// If true, the CSP upgrade-insecure-requests directive is NOT added.
	CSPUpgradeInsecureRequestsDisabled bool
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

func (s *Secure) Handle(ctx *api.Context, next func()) {
	ctx.Response.RegisterOnBeforeWriteHeader(func() {
		s.Apply(ctx.Response.Header())
	})

	next()
}

func (s *Secure) Apply(header http.Header) {
	config := s

	if header.Get("Content-Security-Policy") == "" && !config.CSPDisabled {
		csp := []string{}

		if config.CSPDefaultSrc != "-" {
			csp = append(csp, "default-src "+shorthand.Coalesce(config.CSPDefaultSrc, DefaultCSPDefaultSrc))
		}

		if config.CSPScriptSrc != "-" {
			csp = append(csp, "script-src "+shorthand.Coalesce(config.CSPScriptSrc, DefaultCSPScriptSrc))
		}

		if config.CSPScriptSrcAttr != "-" {
			csp = append(csp, "script-src-attr "+shorthand.Coalesce(config.CSPScriptSrcAttr, DefaultCSPScriptSrcAttr))
		}

		if config.CSPStyleSrc != "-" {
			csp = append(csp, "style-src "+shorthand.Coalesce(config.CSPStyleSrc, DefaultCSPStyleSrc))
		}

		if config.CSPStyleSrcAttr != "-" && config.CSPStyleSrcAttr != "" {
			csp = append(csp, "style-src-attr "+config.CSPStyleSrcAttr)
		}

		if config.CSPStyleSrcElem != "-" && config.CSPStyleSrcElem != "" {
			csp = append(csp, "style-src-elem "+config.CSPStyleSrcElem)
		}

		if config.CSPImgSrc != "-" {
			csp = append(csp, "img-src "+shorthand.Coalesce(config.CSPImgSrc, DefaultCSPImgSrc))
		}

		if config.CSPFontSrc != "-" {
			csp = append(csp, "font-src "+shorthand.Coalesce(config.CSPFontSrc, DefaultCSPFontSrc))
		}

		if config.CSPObjectSrc != "-" {
			csp = append(csp, "object-src "+shorthand.Coalesce(config.CSPObjectSrc, DefaultCSPObjectSrc))
		}

		if config.CSPChildSrc != "-" && config.CSPChildSrc != "" {
			csp = append(csp, "child-src "+config.CSPChildSrc)
		}

		if config.CSPConnectSrc != "-" {
			csp = append(csp, "connect-src "+config.CSPConnectSrc)
		}

		if config.CSPManifestSrc != "-" && config.CSPManifestSrc != "" {
			csp = append(csp, "manifest-src "+config.CSPManifestSrc)
		}

		if config.CSPMediaSrc != "-" && config.CSPMediaSrc != "" {
			csp = append(csp, "media-src "+config.CSPMediaSrc)
		}

		if config.CSPWorkerSrc != "-" && config.CSPWorkerSrc != "" {
			csp = append(csp, "worker-src "+config.CSPWorkerSrc)
		}

		if config.CSPBaseURI != "-" {
			csp = append(csp, "base-uri "+shorthand.Coalesce(config.CSPBaseURI, DefaultCSPBaseURI))
		}

		if config.CSPFormAction != "-" {
			csp = append(csp, "form-action "+shorthand.Coalesce(config.CSPFormAction, DefaultCSPFormAction))
		}

		if config.CSPFrameAncestors != "-" {
			csp = append(csp, "frame-ancestors "+shorthand.Coalesce(config.CSPFrameAncestors, DefaultCSPFrameAncestors))
		}

		if !config.CSPUpgradeInsecureRequestsDisabled {
			csp = append(csp, "upgrade-insecure-requests")
		}

		if len(csp) > 0 {
			header.Set("Content-Security-Policy", strings.Join(csp, ";"))
		}
	}

	if header.Get("Cross-Origin-Embedder-Policy") == "" && config.CrossOriginEmbedderPolicy != "-" && config.CrossOriginEmbedderPolicy != "" {
		header.Set("Cross-Origin-Embedder-Policy", config.CrossOriginEmbedderPolicy)
	}

	if header.Get("Cross-Origin-Opener-Policy") == "" && config.CrossOriginOpenerPolicy != "-" {
		header.Set("Cross-Origin-Opener-Policy", shorthand.Coalesce(config.CrossOriginOpenerPolicy, DefaultCrossOriginOpenerPolicy))
	}

	if header.Get("Cross-Origin-Resource-Policy") == "" && config.CrossOriginResourcePolicy != "-" {
		header.Set("Cross-Origin-Resource-Policy", shorthand.Coalesce(config.CrossOriginResourcePolicy, DefaultCrossOriginResourcePolicy))
	}

	if header.Get("Origin-Agent-Cluster") == "" && config.OriginAgentCluster != "-" {
		header.Set("Origin-Agent-Cluster", shorthand.Coalesce(config.OriginAgentCluster, DefaultOriginAgentCluster))
	}

	if header.Get("Referrer-Policy") == "" && config.ReferrerPolicy != "-" {
		header.Set("Referrer-Policy", shorthand.Coalesce(config.ReferrerPolicy, DefaultReferrerPolicy))
	}

	if header.Get("Strict-Transport-Security") == "" && config.StrictTransportSecurity != "-" {
		header.Set("Strict-Transport-Security", shorthand.Coalesce(config.StrictTransportSecurity, DefaultStrictTransportSecurity))
	}

	if header.Get("X-Content-Type-Options") == "" && config.XContentTypeOptions != "-" {
		header.Set("X-Content-Type-Options", shorthand.Coalesce(config.XContentTypeOptions, DefaultXContentTypeOptions))
	}

	if header.Get("X-DNS-Prefetch-Control") == "" && config.XDNSPrefetchControl != "-" {
		header.Set("X-DNS-Prefetch-Control", shorthand.Coalesce(config.XDNSPrefetchControl, DefaultXDNSPrefetchControl))
	}

	if header.Get("X-Download-Options") == "" && config.XDownloadOptions != "-" {
		header.Set("X-Download-Options", shorthand.Coalesce(config.XDownloadOptions, DefaultXDownloadOptions))
	}

	if header.Get("X-Frame-Options") == "" && config.XFrameOptions != "-" {
		header.Set("X-Frame-Options", shorthand.Coalesce(config.XFrameOptions, DefaultXFrameOptions))
	}

	if header.Get("X-Permitted-Cross-Domain-Policies") == "" && config.XPermittedCrossDomainPolicies != "-" {
		header.Set("X-Permitted-Cross-Domain-Policies", shorthand.Coalesce(config.XPermittedCrossDomainPolicies, DefaultXPermittedCrossDomainPolicies))
	}

	if header.Get("X-XSS-Protection") == "" && config.XXSSProtection != "-" {
		header.Set("X-XSS-Protection", shorthand.Coalesce(config.XXSSProtection, DefaultXXSSProtection))
	}

	if !config.XPoweredByEnabled {
		header.Del("X-Powered-By")
	}
}

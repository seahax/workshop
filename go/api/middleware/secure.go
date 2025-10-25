package middleware

import (
	"strings"

	"seahax.com/defaults"
	"seahax.com/go/api"
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
	// If true, the X-Powered-By header is NOT removed.
	XPoweredByEnabled bool
	// X-XSS-Protection header value. If empty, DefaultXXSSProtection is used.
	// If "-", header is not set.
	XXSSProtection string
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
	header := ctx.Response.Header()

	if !s.CSPDisabled {
		csp := []string{}

		if s.CSPDefaultSrc != "-" {
			csp = append(csp, "default-src "+defaults.NonZeroOrDefault(s.CSPDefaultSrc, DefaultCSPDefaultSrc))
		}

		if s.CSPScriptSrc != "-" {
			csp = append(csp, "script-src "+defaults.NonZeroOrDefault(s.CSPScriptSrc, DefaultCSPScriptSrc))
		}

		if s.CSPScriptSrcAttr != "-" {
			csp = append(csp, "script-src-attr "+defaults.NonZeroOrDefault(s.CSPScriptSrcAttr, DefaultCSPScriptSrcAttr))
		}

		if s.CSPStyleSrc != "-" {
			csp = append(csp, "style-src "+defaults.NonZeroOrDefault(s.CSPStyleSrc, DefaultCSPStyleSrc))
		}

		if s.CSPStyleSrcAttr != "-" && s.CSPStyleSrcAttr != "" {
			csp = append(csp, "style-src-attr "+s.CSPStyleSrcAttr)
		}

		if s.CSPStyleSrcElem != "-" && s.CSPStyleSrcElem != "" {
			csp = append(csp, "style-src-elem "+s.CSPStyleSrcElem)
		}

		if s.CSPImgSrc != "-" {
			csp = append(csp, "img-src "+defaults.NonZeroOrDefault(s.CSPImgSrc, DefaultCSPImgSrc))
		}

		if s.CSPFontSrc != "-" {
			csp = append(csp, "font-src "+defaults.NonZeroOrDefault(s.CSPFontSrc, DefaultCSPFontSrc))
		}

		if s.CSPObjectSrc != "-" {
			csp = append(csp, "object-src "+defaults.NonZeroOrDefault(s.CSPObjectSrc, DefaultCSPObjectSrc))
		}

		if s.CSPChildSrc != "-" && s.CSPChildSrc != "" {
			csp = append(csp, "child-src "+s.CSPChildSrc)
		}

		if s.CSPConnectSrc != "-" {
			csp = append(csp, "connect-src "+s.CSPConnectSrc)
		}

		if s.CSPManifestSrc != "-" && s.CSPManifestSrc != "" {
			csp = append(csp, "manifest-src "+s.CSPManifestSrc)
		}

		if s.CSPMediaSrc != "-" && s.CSPMediaSrc != "" {
			csp = append(csp, "media-src "+s.CSPMediaSrc)
		}

		if s.CSPWorkerSrc != "-" && s.CSPWorkerSrc != "" {
			csp = append(csp, "worker-src "+s.CSPWorkerSrc)
		}

		if s.CSPBaseURI != "-" {
			csp = append(csp, "base-uri "+defaults.NonZeroOrDefault(s.CSPBaseURI, DefaultCSPBaseURI))
		}

		if s.CSPFormAction != "-" {
			csp = append(csp, "form-action "+defaults.NonZeroOrDefault(s.CSPFormAction, DefaultCSPFormAction))
		}

		if s.CSPFrameAncestors != "-" {
			csp = append(csp, "frame-ancestors "+defaults.NonZeroOrDefault(s.CSPFrameAncestors, DefaultCSPFrameAncestors))
		}

		if !s.CSPUpgradeInsecureRequestsDisabled {
			csp = append(csp, "upgrade-insecure-requests")
		}

		if len(csp) > 0 {
			header.Set("Content-Security-Policy", strings.Join(csp, ";"))
		}
	}

	if s.CrossOriginEmbedderPolicy != "-" && s.CrossOriginEmbedderPolicy != "" {
		header.Set("Cross-Origin-Embedder-Policy", s.CrossOriginEmbedderPolicy)
	}

	if s.CrossOriginOpenerPolicy != "-" {
		header.Set("Cross-Origin-Opener-Policy", defaults.NonZeroOrDefault(s.CrossOriginOpenerPolicy, DefaultCrossOriginOpenerPolicy))
	}

	if s.CrossOriginResourcePolicy != "-" {
		header.Set("Cross-Origin-Resource-Policy", defaults.NonZeroOrDefault(s.CrossOriginResourcePolicy, DefaultCrossOriginResourcePolicy))
	}

	if s.OriginAgentCluster != "-" {
		header.Set("Origin-Agent-Cluster", defaults.NonZeroOrDefault(s.OriginAgentCluster, DefaultOriginAgentCluster))
	}

	if s.ReferrerPolicy != "-" {
		header.Set("Referrer-Policy", defaults.NonZeroOrDefault(s.ReferrerPolicy, DefaultReferrerPolicy))
	}

	if s.StrictTransportSecurity != "-" {
		header.Set("Strict-Transport-Security", defaults.NonZeroOrDefault(s.StrictTransportSecurity, DefaultStrictTransportSecurity))
	}

	if s.XContentTypeOptions != "-" {
		header.Set("X-Content-Type-Options", defaults.NonZeroOrDefault(s.XContentTypeOptions, DefaultXContentTypeOptions))
	}

	if s.XDNSPrefetchControl != "-" {
		header.Set("X-DNS-Prefetch-Control", defaults.NonZeroOrDefault(s.XDNSPrefetchControl, DefaultXDNSPrefetchControl))
	}

	if s.XDownloadOptions != "-" {
		header.Set("X-Download-Options", defaults.NonZeroOrDefault(s.XDownloadOptions, DefaultXDownloadOptions))
	}

	if s.XFrameOptions != "-" {
		header.Set("X-Frame-Options", defaults.NonZeroOrDefault(s.XFrameOptions, DefaultXFrameOptions))
	}

	if s.XPermittedCrossDomainPolicies != "-" {
		header.Set("X-Permitted-Cross-Domain-Policies", defaults.NonZeroOrDefault(s.XPermittedCrossDomainPolicies, DefaultXPermittedCrossDomainPolicies))
	}

	if !s.XPoweredByEnabled {
		header.Del("X-Powered-By")
	}

	if s.XXSSProtection != "-" {
		header.Set("X-XSS-Protection", defaults.NonZeroOrDefault(s.XXSSProtection, DefaultXXSSProtection))
	}

	next()
}

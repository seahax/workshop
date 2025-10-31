package handler

import (
	"net/http"
	"regexp"
	"slices"
	"strings"

	"seahax.com/go/serve/server"
)

type HeadersConfig struct {
	Headers      map[string]string
	CacheControl []*CacheControlConfig
	Cors         struct {
		Origins       []string
		Methods       []string
		Headers       []string
		ExposeHeaders []string
	}
}

type CacheControlConfig struct {
	Pattern *regexp.Regexp
	Value   string
}

// Set response headers.
func Headers(config *HeadersConfig, response *server.Response, request *http.Request) {
	for key, value := range config.Headers {
		response.Header().Set(key, value)
	}

	cacheControl := config.GetCacheControl(request.URL.Path)

	if cacheControl != "" {
		response.Header().Set("Cache-Control", cacheControl)
	}

	if response.Header().Get("Cache-Control") == "" {
		response.Header().Set("Cache-Control", "no-cache")
	}

	response.Header().Del("Access-Control-Allow-Origin")
	response.Header().Del("Access-Control-Allow-Methods")
	response.Header().Del("Access-Control-Allow-Headers")
	response.Header().Del("Access-Control-Expose-Headers")

	origin := request.Header.Get("Origin")
	if origin != "" && config.Cors.Origins != nil && (slices.Contains(config.Cors.Origins, origin) || slices.Contains(config.Cors.Origins, "*")) {
		response.Header().Set("Access-Control-Allow-Origin", origin)

		methods := strings.Join(config.Cors.Methods, ", ")
		headers := strings.Join(config.Cors.Headers, ", ")
		exposeHeaders := strings.Join(config.Cors.ExposeHeaders, ", ")

		if methods != "" {
			response.Header().Set("Access-Control-Allow-Methods", methods)
		}

		if headers != "" {
			response.Header().Set("Access-Control-Allow-Headers", headers)
		}

		if exposeHeaders != "" {
			response.Header().Set("Access-Control-Expose-Headers", exposeHeaders)
		}
	}

	response.Header().Add("Vary", "Origin")

	// Go doesn't normalize or sanitize response headers, and there's some debate
	// about whether Vary works as intended if the header is present multiple
	// times rather than once with a comma separated value. This normalizes it to
	// comma separated just-in-time. We only do this for Vary, because it's the
	// only header we intentionally add more than once.
	response.RegisterOnWriteHeader(func(_ int) {
		values := response.Header().Values("Vary")

		if len(values) > 0 {
			values = slices.Clone(values)

			for i, v := range values {
				values[i] = http.CanonicalHeaderKey(v)
			}

			slices.Sort(values)
			values = slices.Compact(values)
			response.Header().Set("Vary", strings.Join(values, ", "))
		}
	})
}

func (c *HeadersConfig) GetCacheControl(filename string) string {
	for _, entry := range c.CacheControl {

		if entry.Pattern.Match([]byte(filename)) {
			return entry.Value
		}
	}

	return ""
}

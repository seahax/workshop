package handler

import (
	"net/http"
	"slices"
	"strings"

	"seahax.com/go/serve/server"
)

type HeadersConfig struct {
	Headers      map[string]string
	CacheControl []func(string) string
	Cors         struct {
		Origins       []string
		Methods       []string
		Headers       []string
		ExposeHeaders []string
	}
}

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

	response.RegisterOnWriteHeader(func(_ int) {
		vary := response.Header().Values("Vary")
		varyDedupe := map[string]bool{}
		varyValues := []string{}

		for _, value := range vary {
			dedupeKey := strings.ToLower(value)

			if _, ok := varyDedupe[dedupeKey]; ok {
				continue
			}

			varyDedupe[dedupeKey] = true
			varyValues = append(varyValues, value)
		}

		if len(varyValues) > 0 {
			response.Header().Set("Vary", strings.Join(varyValues, ", "))
		} else {
			response.Header().Del("Vary")
		}
	})
}

func (c *HeadersConfig) GetCacheControl(filename string) string {
	for _, callback := range c.CacheControl {

		if value := callback(filename); value != "" {
			return value
		}
	}

	return ""
}

package handler

import (
	"compress/gzip"
	"fmt"
	"log/slog"
	"mime"
	"net/http"
	"slices"
	"strconv"
	"strings"

	"seahax.com/go/serve/server"
)

type CompressConfig struct {
	MinBytes  int
	MimeTypes []string
}

// Conditionally compress the response body.
func Compress(config *CompressConfig, response *server.Response, request *http.Request) func() {
	close := func() error { /* noop */ return nil }
	response.Header().Add("Vary", "Accept-Encoding")
	response.RegisterOnWriteHeader(func(_ int) {
		if IsCompressibleRequest(request) && IsCompressibleResponse(response, config) {
			writer := gzip.NewWriter(response.Writer)
			close = writer.Close
			response.Writer = writer
			response.Header().Set("Content-Encoding", "gzip")
			response.Header().Del("Content-Length")
		}
	})

	return func() {
		if err := close(); err != nil {
			slog.Warn(fmt.Sprintf("Error closing gzip writer: %v", err))
		}
	}
}

func IsCompressibleRequest(request *http.Request) bool {
	for _, value := range request.Header.Values("Accept-Encoding") {
		if strings.Contains(value, "gzip") {
			return true
		}
	}

	return false
}

func IsCompressibleResponse(response *server.Response, config *CompressConfig) bool {
	header := response.Header()

	if response.Header().Get("Content-Encoding") != "" {
		return false
	}

	contentType := header.Get("Content-Type")
	contentMimeType, _, err := mime.ParseMediaType(contentType)

	if err == nil {
		match := slices.ContainsFunc(config.MimeTypes, func(configMimeType string) bool {
			if configMimeType == contentMimeType {
				return true
			}

			if prefix, ok := strings.CutSuffix(configMimeType, "*"); ok {
				if strings.HasPrefix(contentMimeType, prefix) {
					return true
				}
			}

			if configMimeType == "*/*" {
				return true
			}

			return false
		})

		if !match {
			return false
		}
	}

	length, err := strconv.Atoi(header.Get("Content-Length"))

	if err == nil && length < config.MinBytes {
		return false
	}

	return true
}

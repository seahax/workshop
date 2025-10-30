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

func Compress(config *CompressConfig, response *server.Response, request *http.Request) func() {
	response.RegisterOnWriteHeader(func(_ int) {
		response.Header().Add("Vary", "Accept-Encoding")
	})

	if !strings.Contains(request.Header.Get("Accept-Encoding"), "gzip") {
		return func() {}
	}

	var close func() error

	response.RegisterOnWriteHeader(func(_ int) {
		if isCompressible(config, response.Header()) {
			writer := gzip.NewWriter(response.Writer)
			close = writer.Close
			response.Writer = writer
			response.Header().Set("Content-Encoding", "gzip")
			response.Header().Del("Content-Length")
		}
	})

	return func() {
		if close != nil {
			if err := close(); err != nil {
				slog.Warn(fmt.Sprintf("Error closing gzip writer: %v", err))
			}
		}
	}
}

func isCompressible(config *CompressConfig, responseHeader http.Header) bool {
	if responseHeader.Get("Content-Encoding") != "" {
		return false
	}

	contentType := responseHeader.Get("Content-Type")
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

	length, err := strconv.Atoi(responseHeader.Get("Content-Length"))

	if err == nil && length < config.MinBytes {
		return false
	}

	return true
}

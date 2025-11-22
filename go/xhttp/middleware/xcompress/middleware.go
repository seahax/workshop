package xcompress

import (
	"fmt"
	"net/http"
	"strconv"

	"seahax.com/go/shorthand"
	"seahax.com/go/xhttp"
)

var defaultAlgorithms = []Algorithm{
	Brotli(),
	Zstd(),
	Gzip(),
	Deflate(),
}

// Compression middleware options.
type Options struct {
	// Filter requests that are eligible for compression. If nil, all text/* and
	// application/* types are compressed.
	Filter Filter
	// Minimum size in bytes to trigger compression. If zero,
	// CompressMinSizeDefault is used.
	MinSize int
	// Supported compression Algorithm slice in order of preference. If empty,
	// Brotli, Gzip, and Deflate are supported.
	Algorithms []Algorithm
}

const (
	CompressMinSizeDefault = 1024
)

// Create a Middleware that compresses response automatically based on content
// encoding, type, and length.
func New(options Options) xhttp.Middleware {
	filter := shorthand.Coalesce(options.Filter, DefaultFilter)
	minSize := shorthand.Coalesce(options.MinSize, CompressMinSizeDefault)
	algorithms := shorthand.Coalesce(options.Algorithms, defaultAlgorithms)
	algorithmCollection := newAlgorithmCollection(algorithms)

	return func(writer http.ResponseWriter, request *http.Request, next http.HandlerFunc) {
		innerWriter := &innerWriter{
			writer: writer,
		}

		defer func() {
			if innerWriter.encodingWriter != nil {
				if err := innerWriter.encodingWriter.Close(); err != nil {
					xhttp.Logger(request).Error(fmt.Sprintf("Error closing compression writer: %v", err))
				}
			}
		}()

		writer = xhttp.WithWriter(writer, innerWriter)
		writer = xhttp.WithBeforeWriteCallback(writer, func(_ int) {
			header := writer.Header()

			if isCompressible(request, minSize) && filter(request) {
				encodingWriter, encoding, err := algorithmCollection.Writer(header.Values("Accept-Encoding"), writer)

				if err != nil {
					xhttp.Logger(request).Warn(fmt.Sprintf("Error creating compression writer: %v", err))
				} else {
					header.Set("Content-Encoding", encoding)
					header.Del("Content-Length")
					innerWriter.encodingWriter = encodingWriter
				}
			}

			header.Set("Vary", "Accept-Encoding")
		})

		next(writer, request)
	}
}

var defaultMiddleware xhttp.Middleware

func init() {
	defaultMiddleware = New(Options{})
}

// Get the default compression middleware. All options are defaulted.
func Default() xhttp.Middleware {
	return defaultMiddleware
}

func isCompressible(request *http.Request, minSize int) bool {
	contentEncoding := request.Header.Get("Content-Encoding")

	if contentEncoding != "" {
		// Already encoded
		return false
	}

	contentLength := request.Header.Get("Content-Length")

	if value, err := strconv.Atoi(contentLength); err != nil || value < minSize {
		return false
	}

	return true
}

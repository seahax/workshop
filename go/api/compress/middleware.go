package compress

import (
	"fmt"
	"io"
	"net/http"
	"strconv"
	"strings"

	"seahax.com/go/api"
	"seahax.com/go/api/negotiator"
	"seahax.com/go/shorthand"
)

var defaultAlgorithms = []Algorithm{
	Brotli(),
	Zstd(),
	Gzip(),
	Deflate(),
}

// Middleware responses automatically based on content encoding, type, and
// length.
type Middleware struct {
	// Supported compression Algorithm array in order of preference. If empty,
	// Brotli, Gzip, and Deflate are supported.
	Algorithms []Algorithm
	// Filter function to determine if a content type should be compressed.
	// If nil, all text/* and application/* types are compressed.
	Filter func(contentType string) bool
	// Minimum size in bytes to trigger compression. If zero,
	// CompressMinSizeDefault is used.
	MinSize int
}

const (
	CompressMinSizeDefault = 1024
)

func (m *Middleware) GetMiddleware() api.MiddlewareHandler {
	algorithms := shorthand.Coalesce(m.Algorithms, defaultAlgorithms)
	filter := shorthand.Coalesce(m.Filter, DefaultFilter)
	minSize := shorthand.Coalesce(m.MinSize, CompressMinSizeDefault)

	return func(ctx *api.Context, next func()) {
		response := ctx.Response
		header := response.Header()

		var cleanup func()

		defer func() {
			if cleanup != nil {
				cleanup()
			}
		}()

		response.RegisterOnBeforeWriteHeader(func() {
			if isCompressible(header, minSize, filter) {
				offers, writers := getOffersAndWriters(algorithms)
				negotiator := getNegotiator(offers)
				encoding, ok := negotiator.Match(header.Values("Accept-Encoding"))

				if ok {
					writer, err := writers[encoding](response.Writer)

					if err != nil {
						ctx.Logger.Error(fmt.Sprintf("Error creating %s writer: %v", encoding, err))
					} else {
						header.Set("Content-Encoding", encoding)
						header.Del("Content-Length")
						response.Writer = writer
						cleanup = func() {
							if err := writer.Close(); err != nil {
								ctx.Logger.Error(fmt.Sprintf("Error closing %s writer: %v", encoding, err))
							}
						}
					}
				}
			}

			header.Set("Vary", "Accept-Encoding")
		})

		next()
	}
}

// Default filter function which applies compression to text/* and
// application/* content types.
func DefaultFilter(contentType string) bool {
	return strings.HasPrefix(contentType, "text/") ||
		strings.HasPrefix(contentType, "application/")
}

func isCompressible(header http.Header, minSize int, filter func(contentType string) bool) bool {
	contentEncoding := header.Get("Content-Encoding")

	if contentEncoding != "" {
		// Already encoded
		return false
	}

	contentLength := header.Get("Content-Length")

	if value, err := strconv.Atoi(contentLength); err != nil || value < minSize {
		return false
	}

	contentType := header.Get("Content-Type")

	return filter(contentType)
}

func getOffersAndWriters(algorithms []Algorithm) (offers []string, writers map[string]func(io.Writer) (io.WriteCloser, error)) {
	offers = make([]string, 0, len(algorithms))
	writers = make(map[string]func(io.Writer) (io.WriteCloser, error), len(algorithms))

	for _, algo := range algorithms {
		offers = append(offers, algo.Name)
		writers[algo.Name] = algo.GetWriter
	}

	return offers, writers
}

func getNegotiator(offers []string) negotiator.Negotiator {
	return negotiator.Negotiator{
		IsParameterized: true,
		IsMediaType:     true,
		Offers:          offers,
	}
}

package middleware

import (
	"compress/flate"
	"compress/gzip"
	"fmt"
	"io"
	"net/http"
	"strconv"
	"strings"

	"github.com/andybalholm/brotli"
	"github.com/klauspost/compress/zstd"
	"seahax.com/go/api"
	"seahax.com/go/shorthand"
)

// Compression algorithm definition.
type Algorithm struct {
	// The name of the algorithm which must match an Accept-Encoding value
	// exactly.
	Name string
	// Return a WriteCloser that wraps the provided io.Writer with compression.
	GetWriter func(io.Writer) (io.WriteCloser, error)
}

// Brotli compression algorithm with default compression level.
func Brotli() Algorithm { return BrotliLevel(brotli.DefaultCompression) }

// Brotli compression algorithm with custom compression level.
func BrotliLevel(level int) Algorithm {
	return Algorithm{
		Name: "br",
		GetWriter: func(w io.Writer) (io.WriteCloser, error) {
			return brotli.NewWriterLevel(w, level), nil
		},
	}
}

// Zstd compression algorithm with default compression level.
func Zstd() Algorithm { return ZstdLevel(zstd.SpeedDefault) }

// Zstd compression algorithm with custom compression level.
func ZstdLevel(level zstd.EncoderLevel) Algorithm {
	return Algorithm{
		Name: "zstd",
		GetWriter: func(w io.Writer) (io.WriteCloser, error) {
			encoder, err := zstd.NewWriter(w, zstd.WithEncoderLevel(level))
			if err != nil {
				return nil, err
			}
			return encoder, nil
		},
	}
}

// Gzip compression algorithm with default compression level.
func Gzip() Algorithm { return GzipLevel(gzip.DefaultCompression) }

// Gzip compression algorithm with custom compression level.
func GzipLevel(level int) Algorithm {
	return Algorithm{
		Name: "gzip",
		GetWriter: func(w io.Writer) (io.WriteCloser, error) {
			return gzip.NewWriterLevel(w, level)
		},
	}
}

// Deflate compression algorithm with default compression level.
func Deflate() Algorithm { return DeflateLevel(flate.DefaultCompression) }

// Deflate compression algorithm with custom compression level.
func DeflateLevel(level int) Algorithm {
	return Algorithm{
		Name: "deflate",
		GetWriter: func(w io.Writer) (io.WriteCloser, error) {
			return flate.NewWriter(w, level)
		},
	}
}

var defaultAlgorithms = []Algorithm{
	Brotli(),
	Zstd(),
	Gzip(),
	Deflate(),
}

// Compress responses automatically based on content encoding, type, and
// length.
type Compress struct {
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

func (c *Compress) Handle(ctx *api.Context, next func()) {
	response := ctx.Response
	header := response.Header()

	var cleanup func()

	defer func() {
		if cleanup != nil {
			cleanup()
		}
	}()

	response.RegisterOnBeforeWriteHeader(func() {
		if isCompressible(header, c.MinSize, c.Filter) {
			algorithms := shorthand.Coalesce(c.Algorithms, defaultAlgorithms)
			offers, writers := getOffersAndWriters(algorithms)
			negotiator := getNegotiator(offers)
			encoding, ok := negotiator.Match(header.Values("Accept-Encoding"))

			if ok {
				writer, err := writers[encoding](response.Writer)

				if err != nil {
					ctx.Log.Error(fmt.Sprintf("Error creating %s writer: %v", encoding, err))
				} else {
					header.Set("Content-Encoding", encoding)
					header.Del("Content-Length")
					response.Writer = writer
					cleanup = func() {
						if err := writer.Close(); err != nil {
							ctx.Log.Error(fmt.Sprintf("Error closing %s writer: %v", encoding, err))
						}
					}
				}
			}
		}

		header.Set("Vary", "Accept-Encoding")
	})

	next()
}

// Default filter function which applies compression to text/* and
// application/* content types.
func CompressFilterDefault(contentType string) bool {
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
	minSize = shorthand.Coalesce(minSize, CompressMinSizeDefault)

	if value, err := strconv.Atoi(contentLength); err != nil || value < minSize {
		return false
	}

	contentType := header.Get("Content-Type")
	filter = shorthand.Coalesce(filter, CompressFilterDefault)

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

func getNegotiator(offers []string) api.Negotiator {
	return api.Negotiator{
		IsParameterized: true,
		IsMediaType:     true,
		Offers:          offers,
	}
}

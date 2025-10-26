package middleware

import (
	"compress/flate"
	"compress/gzip"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"strconv"
	"strings"

	"github.com/andybalholm/brotli"
	"github.com/klauspost/compress/zstd"
	"github.com/seahax/workshop/go/api"
	"github.com/seahax/workshop/go/defaults"
)

type Algorithm struct {
	Name   string
	Writer func(io.Writer) (io.WriteCloser, error)
}

// Brotli compression algorithm with default compression level.
func Brotli() Algorithm { return BrotliLevel(brotli.DefaultCompression) }

// Brotli compression algorithm with custom compression level.
func BrotliLevel(level int) Algorithm {
	return Algorithm{
		Name: "br",
		Writer: func(w io.Writer) (io.WriteCloser, error) {
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
		Writer: func(w io.Writer) (io.WriteCloser, error) {
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
		Writer: func(w io.Writer) (io.WriteCloser, error) {
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
		Writer: func(w io.Writer) (io.WriteCloser, error) {
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
	ctx.Response.ResponseWriter = &compressResponseWriter{
		ResponseWriter: ctx.Response.ResponseWriter,
		config:         c,
		cleanup:        ctx.Cleanup,
		log:            ctx.Response.Log,
	}

	next()
}

type compressResponseWriter struct {
	api.ResponseWriter
	config  *Compress
	writer  io.WriteCloser
	cleanup func(callback func())
	log     *slog.Logger
}

func (w *compressResponseWriter) WriteHeader(statusCode int) {
	header := w.Header()

	if isCompressible(header, w.config.MinSize, w.config.Filter) {
		algorithms := defaults.NonZeroOrDefault(w.config.Algorithms, defaultAlgorithms)
		offers, writers := getOffersAndWriters(algorithms)
		negotiator := getNegotiator(offers)
		encoding, ok := negotiator.Match(header.Values("Accept-Encoding"))

		if ok {
			writer, err := writers[encoding](w.ResponseWriter)

			if err != nil {
				w.log.Error(fmt.Sprintf("Error creating %s writer: %v", encoding, err))
			} else {

				w.cleanup(func() {
					if err := writer.Close(); err != nil {
						w.log.Error(fmt.Sprintf("Error closing %s writer: %v", encoding, err))
					}
				})
				w.writer = writer
				header.Set("Content-Encoding", encoding)
				header.Del("Content-Length")
			}
		}
	}

	header.Set("Vary", "Accept-Encoding")
	w.ResponseWriter.WriteHeader(statusCode)
}

func (w *compressResponseWriter) Write(data []byte) (int, error) {
	if !w.Written() {
		w.WriteHeader(http.StatusOK)
	}

	// Use the compression writer if available, or default to the regular
	// response writer.
	writer := defaults.NonZeroOrDefault[io.Writer](w.writer, w.ResponseWriter)

	return writer.Write(data)
}

func CompressFilterDefault(contentType string) bool {
	return strings.HasPrefix(contentType, "text/") ||
		strings.HasPrefix(contentType, "application/")
}

func getOffersAndWriters(algorithms []Algorithm) (offers []string, writers map[string]func(io.Writer) (io.WriteCloser, error)) {
	offers = make([]string, 0, len(algorithms))
	writers = make(map[string]func(io.Writer) (io.WriteCloser, error), len(algorithms))

	for _, algo := range algorithms {
		offers = append(offers, algo.Name)
		writers[algo.Name] = algo.Writer
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

func isCompressible(header http.Header, minSize int, filter func(contentType string) bool) bool {
	contentEncoding := header.Get("Content-Encoding")
	if contentEncoding != "" {
		// Already encoded
		return false
	}

	contentLength := header.Get("Content-Length")
	minSize = defaults.NonZeroOrDefault(minSize, CompressMinSizeDefault)
	if value, err := strconv.Atoi(contentLength); err != nil || value < minSize {
		return false
	}

	contentType := header.Get("Content-Type")
	filter = defaults.NonZeroOrDefault(filter, CompressFilterDefault)

	return filter(contentType)
}

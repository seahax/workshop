package xcompress

import (
	"io"

	"github.com/andybalholm/brotli"
)

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

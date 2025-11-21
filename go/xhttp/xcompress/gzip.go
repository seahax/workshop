package xcompress

import (
	"compress/gzip"
	"io"
)

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

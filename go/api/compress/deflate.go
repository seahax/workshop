package compress

import (
	"compress/flate"
	"io"
)

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

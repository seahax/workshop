package xcompress

import (
	"io"

	"github.com/klauspost/compress/zstd"
)

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

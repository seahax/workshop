package compress

import "io"

// Compression algorithm definition.
type Algorithm struct {
	// The name of the algorithm which must match an Accept-Encoding value
	// exactly.
	Name string
	// Return a WriteCloser that wraps the provided io.Writer with compression.
	GetWriter func(io.Writer) (io.WriteCloser, error)
}

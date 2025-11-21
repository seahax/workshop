package xcompress

import (
	"io"

	"seahax.com/go/xhttp/internal/negotiator"
)

// Compression algorithm definition.
type Algorithm struct {
	// Name of an encoding algorithm which must match an Accept-Encoding value
	// exactly.
	Name string
	// Return a WriteCloser that wraps the provided io.Writer with compression.
	GetWriter func(io.Writer) (io.WriteCloser, error)
}

type matcher struct {
	writers    map[string]func(io.Writer) (io.WriteCloser, error)
	negotiator negotiator.Negotiator
}

func newAlgorithmCollection(algorithms []Algorithm) *matcher {
	offers := make([]string, 0, len(algorithms))
	writers := make(map[string]func(io.Writer) (io.WriteCloser, error), len(algorithms))

	for _, algo := range algorithms {
		offers = append(offers, algo.Name)
		writers[algo.Name] = algo.GetWriter
	}

	negotiator := negotiator.Negotiator{
		IsParameterized: true,
		IsMediaType:     true,
		Offers:          offers,
	}

	return &matcher{
		writers:    writers,
		negotiator: negotiator,
	}
}

func (c *matcher) Writer(acceptHeaders []string, innerWriter io.Writer) (io.WriteCloser, string, error) {
	encoding, ok := c.negotiator.Match(acceptHeaders)

	if !ok {
		return nil, "", nil
	}

	writer, err := c.writers[encoding](innerWriter)

	if err != nil {
		return nil, encoding, err
	}

	return writer, encoding, nil
}

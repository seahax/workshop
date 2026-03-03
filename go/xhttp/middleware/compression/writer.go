package xcompress

import "io"

type innerWriter struct {
	writer         io.Writer
	encodingWriter io.WriteCloser
}

func (f innerWriter) Write(bytes []byte) (int, error) {
	if f.encodingWriter != nil {
		return f.encodingWriter.Write(bytes)
	}

	return f.writer.Write(bytes)
}

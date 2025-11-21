package xhttp

import (
	"io"
	"net/http"
)

// Get a new [net/http.ResponseWriter] that writes response body data to the
// provided [io.Writer]. Useful for adding compression or other transformations
// to response data.
func WithWriter(writer http.ResponseWriter, innerWriter io.Writer) http.ResponseWriter {
	return &writerx{
		ResponseWriter: writer,
		writer:         innerWriter,
	}
}

// Get a new [net/http.ResponseWriter] that invokes the provided callback just
// before the WriteHeader method is called for the first time.
func WithBeforeWriteCallback(writer http.ResponseWriter, callback func(status int)) http.ResponseWriter {
	return &writerx{
		ResponseWriter: writer,
		writer:         writer,
		writeCallback:  callback,
	}
}

type writerx struct {
	http.ResponseWriter
	written       bool
	writer        io.Writer
	writeCallback func(status int)
}

func (w *writerx) Write(data []byte) (int, error) {
	if !w.written {
		w.WriteHeader(http.StatusOK)
	}

	return w.writer.Write(data)
}

func (w *writerx) WriteHeader(statusCode int) {
	if !w.written {
		w.written = true

		if w.writeCallback != nil {
			w.writeCallback(statusCode)
		}
	}

	w.ResponseWriter.WriteHeader(statusCode)
}

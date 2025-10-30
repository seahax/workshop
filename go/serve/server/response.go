package server

import (
	"io"
	"net/http"
	"slices"
)

type Response struct {
	base          http.ResponseWriter
	written       bool
	onWriteHeader []func(status int)
	Writer        io.Writer
}

func NewResponse(base http.ResponseWriter) *Response {
	return &Response{
		base:   base,
		Writer: base,
	}
}

func (w *Response) RegisterOnWriteHeader(callback func(status int)) {
	w.onWriteHeader = append(w.onWriteHeader, callback)
}

func (w *Response) Header() http.Header {
	return w.base.Header()
}

func (w *Response) WriteHeader(statusCode int) {
	if !w.written {
		w.written = true

		for _, callback := range slices.Backward(w.onWriteHeader) {
			callback(statusCode)
		}
	}

	w.base.WriteHeader(statusCode)
}

func (w *Response) Write(b []byte) (int, error) {
	if !w.written {
		w.WriteHeader(http.StatusOK)
	}

	if w.Writer == nil {
		return w.base.Write(b)
	}

	return w.Writer.Write(b)
}

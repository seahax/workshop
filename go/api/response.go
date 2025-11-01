package api

import (
	"encoding/json"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"strconv"
	"sync/atomic"
	"time"

	"seahax.com/go/shorthand"
)

// Response accessor with convenience methods for writing common responses.
//
// Use the NewResponse constructor to create Response instances.
type Response struct {
	header              func() http.Header
	writeHeader         func(statusCode int)
	status              atomic.Int32
	onBeforeWriteHeader shorthand.Observable[any]

	// The underlying [io.Writer] for writing response body data. This can be
	// wrapped by middleware to provide features like compression.
	io.Writer
	// The associated HTTP request.
	Request *http.Request
	// The parent API Logger.
	Logger *slog.Logger
}

// Returns the response header.
func (r *Response) Header() http.Header {
	return r.header()
}

// Write the header and status code to the response. This should only be called
// once per response. After it is called, the header and status code can no
// longer be modified.
func (r *Response) WriteHeader(statusCode int) {
	if statusCode < 100 || statusCode > 599 {
		panic(fmt.Sprintf("invalid WriteHeader status code %d", statusCode))
	}

	ok := r.status.CompareAndSwap(0, int32(statusCode))

	if ok {
		r.onBeforeWriteHeader.NotifyBackwards(nil)
	}

	// Don't guard against multiple calls to the underlying ResponseWriter
	// because it has internals for hijacking and warning that should be
	// preserved.
	r.writeHeader(statusCode)
}

// Return the status code that was written to the response by WriteHeader. If
// WriteHeader has not been called yet, this returns 0.
func (r *Response) Status() int {
	return int(r.status.Load())
}

// Returns true if WriteHeader has been called for this response.
func (r *Response) Written() bool {
	return r.status.Load() != 0
}

// Register a callback that is called before the response header is written.
// This can be used to perform last-minute modifications to the header, log
// information, or decide whether to replace the response Writer.
func (r *Response) RegisterOnBeforeWriteHeader(callback func()) *shorthand.Subscription[any] {
	return r.onBeforeWriteHeader.Subscribe(func(_ any) { callback() })
}

// Write an error message with the given status code to the response. The
// plain text message will be the standard HTTP status text for the code.
func (r *Response) Error(status int) {
	http.Error(r, http.StatusText(status), status)
}

// Write an plain text error message with the given status code to the
// response.
func (r *Response) ErrorMessage(status int, message string) {
	http.Error(r, message, status)
}

// SetCookie adds a Set-Cookie header to the response.
func (r *Response) SetCookie(cookie *http.Cookie) {
	http.SetCookie(r, cookie)
}

func (r *Response) WriteString(s string) error {
	header := r.Header()
	header.Set("Content-Length", strconv.Itoa(len(s)))

	if header.Get("Content-Type") == "" {
		header.Set("Content-Type", "text/plain")
	}

	_, err := r.Write([]byte(s))

	return err
}

// Write the given value as JSON to the response.
func (r *Response) WriteJSON(v any) error {
	bytes, err := json.Marshal(v)

	if err != nil {
		return err
	}

	header := r.Header()
	header.Set("Content-Length", strconv.Itoa(len(bytes)))

	if header.Get("Content-Type") == "" {
		header.Set("Content-Type", "application/json")
	}

	_, err = r.Write(bytes)

	return err
}

// Write the content of a file to the response.
//
// Features:
//   - Supports range requests.
//   - Honors precondition headers.
//   - Sets Content-Type and Last-Modified headers.
//   - Sets Content-Length header if no Content-Encoding header is set.
//
// This does not set an ETag response header. If you need ETag support, you
// should set the ETag header on the response before calling this method.
//
// See [net/http.ServeContent] for more details.
func (r *Response) WriteFileContent(name string, modified time.Time, content io.ReadSeeker) {
	http.ServeContent(r, r.Request, name, modified, content)
}

// Create a new Response.
func NewResponse(
	logger *slog.Logger,
	responseWriter http.ResponseWriter,
	request *http.Request,
) *Response {
	return &Response{
		header:      responseWriter.Header,
		writeHeader: responseWriter.WriteHeader,
		Writer:      ioWriterFunc(func(b []byte) (int, error) { return responseWriter.Write(b) }),
		Request:     request,
		Logger:      logger,
	}
}

type ioWriterFunc func([]byte) (int, error)

func (f ioWriterFunc) Write(data []byte) (int, error) {
	return f(data)
}

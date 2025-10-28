package api

import (
	"encoding/json"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"os"
	"strconv"
	"strings"
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
	onBeforeWriteHeader shorthand.Observable

	// The underlying [io.Writer] for writing response body data. This can be
	// wrapped by middleware to provide features like compression.
	io.Writer
	// The associated HTTP request.
	Request *http.Request
	// The parent Api Logger.
	Log *slog.Logger
}

func (r *Response) Header() http.Header {
	return r.header()
}

func (r *Response) WriteHeader(statusCode int) {
	if statusCode < 100 || statusCode > 599 {
		panic(fmt.Sprintf("invalid WriteHeader status code %d", statusCode))
	}

	ok := r.status.CompareAndSwap(0, int32(statusCode))

	if ok {
		r.onBeforeWriteHeader.NotifyBackwards()
	}

	// Don't guard against multiple calls to the underlying ResponseWriter
	// because it has internals for hijacking and warning that should be
	// preserved.
	r.writeHeader(statusCode)
}

func (r *Response) Status() int {
	return int(r.status.Load())
}

func (r *Response) Written() bool {
	return r.status.Load() != 0
}

func (r *Response) RegisterOnBeforeWriteHeader(callback func()) {
	r.onBeforeWriteHeader.Subscribe(callback)
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

// Write the given value as JSON to the response.
func (r *Response) WriteJSON(v any) error {
	text, err := json.Marshal(v)

	if err != nil {
		return err
	}

	header := r.Header()
	header.Set("Content-Length", strconv.Itoa(len(text)))

	if header.Get("Content-Type") == "" {
		header.Set("Content-Type", "application/json")
	}

	_, err = r.Write(text)

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

// Read and serve the first file name that exists and is readable. If none can
// be served, a 404 Not Found error will be written to the response. This
// method supports the same features as WriteFileContent.
//
// This method prevents path traversal attacks and ignores dotfiles in the
// fileNames array.
func (r *Response) WriteFile(rootDir string, onBeforeWrite func(fileName string), fileNames ...string) {
	// Skip dotfiles.
	fileNames = shorthand.Filter(fileNames, func(v string) bool {
		return !strings.HasPrefix(v, ".") && !strings.Contains(v, "/.") && !strings.Contains(v, "\\.")
	})

	if len(fileNames) == 0 {
		r.Error(http.StatusNotFound)
		return
	}

	// Use an os.Root to prevent path traversal attacks.
	root, err := os.OpenRoot(rootDir)

	if err != nil {
		r.Log.Error(`Failed to open root directory "`+rootDir+`"`, "error", err)
		r.Error(http.StatusInternalServerError)
		return
	}

	defer root.Close()

	r.WriteFileUnsafe(http.FS(root.FS()), onBeforeWrite, fileNames...)
}

// UNSAFE: This does not provide protection against path traversal attacks and
// it does not filter out dotfiles.
//
// Read and serve the first file name that exists, is readable, and is not a
// directory. If none can be served, a 404 Not Found error will be written to
// the response. This method supports the same features as WriteFileContent.
//
// This method attempts to read and serve fileNames from dir. If a file does
// not exist, is a directory, or cannot be read for any other reason, the next
// file name will be served instead. If none of the file names can be served, a
// 404 Not Found error will be written to the response.
func (r *Response) WriteFileUnsafe(dir http.FileSystem, onBeforeWrite func(fileName string), fileNames ...string) {
	for _, name := range fileNames {
		file, err := dir.Open(name)

		if err != nil {
			continue
		}

		defer file.Close()

		info, err := file.Stat()

		if err != nil || info.IsDir() {
			// Don't serve directories.
			file.Close()
			continue
		}

		if onBeforeWrite != nil {
			onBeforeWrite(name)
		}

		modTime := info.ModTime()
		r.WriteFileContent(name, modTime, file)
		return
	}

	r.Error(http.StatusNotFound)
}

func NewResponse(
	log *slog.Logger,
	responseWriter http.ResponseWriter,
	request *http.Request,
) *Response {
	return &Response{
		header:      responseWriter.Header,
		writeHeader: responseWriter.WriteHeader,
		Writer:      ioWriterFunc(func(b []byte) (int, error) { return responseWriter.Write(b) }),
		Request:     request,
		Log:         log,
	}
}

type ioWriterFunc func([]byte) (int, error)

func (f ioWriterFunc) Write(data []byte) (int, error) {
	return f(data)
}

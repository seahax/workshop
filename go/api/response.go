package api

import (
	"encoding/json"
	"io"
	"log/slog"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"
)

// Response accessor with convenience methods for writing common responses.
type Response struct {
	ResponseWriter
	// The associated HTTP request.
	Request *http.Request
	// The parent Api Logger.
	Log *slog.Logger
	// Register cleanup callbacks to be called when the response is finished.
	Cleanup func(callback func())
}

// Enhanced [http.ResponseWriter] which tracks whether headers have been
// written, the time they were written, and the response status code.
type ResponseWriter interface {
	http.ResponseWriter
	Written() bool
	WriteHeaderTime() int64
	Status() int
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

	return json.NewEncoder(r).Encode(v)
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
	var safeFileNames []string

	for _, name := range fileNames {
		// Skip dotfiles.
		if !strings.HasPrefix(name, ".") && !strings.Contains(name, "/.") && !strings.Contains(name, "\\.") {
			safeFileNames = append(safeFileNames, name)
		}
	}

	if len(safeFileNames) == 0 {
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

	r.WriteFileUnsafe(http.FS(root.FS()), onBeforeWrite, safeFileNames...)
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

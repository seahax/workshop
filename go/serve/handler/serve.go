package handler

import (
	"errors"
	"fmt"
	"io/fs"
	"log/slog"
	"net/http"
	"path"
	"strings"

	"seahax.com/go/serve/server"
)

// Serve the static file that matches the request URL path.
func Serve(root http.Dir, response *server.Response, request *http.Request) {
	if request.Method != http.MethodGet {
		response.Header().Set("Allow", http.MethodGet)
		response.WriteHeader(http.StatusMethodNotAllowed)
		return
	}

	// Normalizes the path so that it always starts with a slash, and any double
	// slashes are collapsed.
	filename := path.Join("/", request.URL.Path)

	if strings.Contains(filename, "/.") {
		// Dotfiles are hidden.
		response.WriteHeader(http.StatusNotFound)
		return
	}

	if strings.HasSuffix(filename, "/") {
		// Directories are not served.
		response.WriteHeader(http.StatusNotFound)
		return
	}

	file, err := root.Open(filename)

	if err != nil {
		if !errors.Is(err, fs.ErrNotExist) {
			// Something other than the file not existing went wrong, which could be
			// a problem.
			slog.Warn(fmt.Sprintf("Failed to open file %q: %v", filename, err))
		}

		// Any failure to read the file is treated as the file not existing.
		response.WriteHeader(http.StatusNotFound)
		return
	}

	defer file.Close()
	fileInfo, err := file.Stat()

	if err != nil || fileInfo.IsDir() {
		// Directories are not served, even without a trailing slash.
		response.WriteHeader(http.StatusNotFound)
		return
	}

	http.ServeContent(response, request, filename, fileInfo.ModTime(), file)
}

package xstatic

import (
	"errors"
	"fmt"
	"io/fs"
	"net/http"

	"seahax.com/go/xhttp"
)

// Static file controller options.
type Options struct {
	// Path prefix for the static route. Defaults to "/".
	PathPrefix string
	// Domain for the static route.
	Domain string
	// Directory on the local filesystem where static files are allowed to be
	// served from. Defaults to the current working directory.
	RootDir string
	// Fallback file name to serve when the requested file does not
	// exist. Useful for SPA routing. If empty, no fallback is used.
	FallbackFileName string
	// Header customization callback.
	Header func(fileName string, header http.Header)
}

// Create a Controller that serves static files from the local filesystem.
//
//   - Disallow serving dotfiles.
//   - Return 405 (Method Not Allowed) for non-GET/HEAD requests.
//   - Prevent path traversal attacks.
//   - Support SPA routing with fallback file name.
//   - Header customization per file.
//
// Internally uses [net/http.ServeContent] to serve files, so features like
// range requests and precondition headers are supported.
func New(options Options) *xhttp.Controller {
	pattern := xhttp.PatternString("", options.Domain, options.PathPrefix, "{fileName...}")

	handler := func(writer http.ResponseWriter, request *http.Request) {
		if request.Method != http.MethodGet && request.Method != http.MethodHead {
			writer.Header().Set("Allow", "GET, HEAD")
			xhttp.Error(writer, http.StatusMethodNotAllowed)
			return
		}

		fileName := request.PathValue("fileName")
		result, err := Open(options.RootDir, fileName, options.FallbackFileName)

		if errors.Is(err, fs.ErrNotExist) {
			xhttp.Error(writer, http.StatusNotFound)
			return
		}

		if err != nil {
			xhttp.Logger(request).Error(fmt.Sprintf("Failed to open file %q", fileName), "error", err)
			xhttp.Error(writer, http.StatusInternalServerError)
			return
		}

		defer result.File.Close()

		if options.Header != nil {
			options.Header(result.Name, writer.Header())
		}

		http.ServeContent(writer, request, result.Name, result.Info.ModTime(), result.File)
	}

	return xhttp.SingleRoute(pattern, handler)
}

package static

import (
	"errors"
	"fmt"
	"io/fs"
	"net/http"
	"path"

	"seahax.com/go/api"
)

// Safely serve static files from the local filesystem.
//
//   - Support SPA routing with fallback file name.
//   - Return 405 (Method Not Allowed) for non-GET/HEAD requests.
//   - Prevent path traversal attacks.
//   - Disallow serving dotfiles by default.
//   - Header customization per file.
//
// Internally uses [net/http.ServeContent] to serve files, so features like
// range requests and precondition headers are supported.
type Route struct {
	// Optional path prefix for the static route. Defaults to "/".
	PathPrefix string
	// Optional domain for the static route.
	Domain string
	// Directory on the local filesystem to serve files from.
	RootDir string
	// Optional fallback file name to serve when the requested file does not
	// exist. Useful for SPA routing. If empty, no fallback is used.
	FallbackFilename string
	// Optional function to customize headers for each served file.
	Header func(fileName string, header http.Header)
	// If true, dotfiles (files or directories starting with a period) are
	// allowed to be served. Default is false.
	AllowDotFiles bool
}

func (r *Route) GetRoute() *api.Route {
	pattern := api.Pattern{
		Domain: r.Domain,
		Path:   path.Join("/", r.PathPrefix, "{fileName...}"),
	}

	root := &rootFS{
		RootDir:       r.RootDir,
		AllowDotFiles: r.AllowDotFiles,
	}

	handler := func(ctx *api.Context) {
		if ctx.Request.Method != http.MethodGet && ctx.Request.Method != http.MethodHead {
			ctx.Response.Header().Set("Allow", "GET, HEAD")
			ctx.Response.Error(http.StatusMethodNotAllowed)
			return
		}

		fileName := ctx.Request.PathValue("fileName")
		result, err := root.Open(fileName, r.FallbackFilename)

		if errors.Is(err, fs.ErrNotExist) {
			ctx.Response.Error(http.StatusNotFound)
			return
		}

		if err != nil {
			ctx.Logger.Error(fmt.Sprintf("Failed to open file %q", fileName), "error", err)
			ctx.Response.Error(http.StatusInternalServerError)
			return
		}

		defer result.File.Close()

		if r.Header != nil {
			r.Header(result.Name, ctx.Response.Header())
		}

		http.ServeContent(ctx.Response, ctx.Request, result.Name, result.Info.ModTime(), result.File)
	}

	return &api.Route{
		Pattern: pattern.String(),
		Handler: handler,
	}
}

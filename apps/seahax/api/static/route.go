package static

import (
	"fmt"
	"net/http"
	"strings"

	"seahax.com/go/api"
)

type Route struct {
	RootDir string
}

func (s *Route) GetRoute() *api.Route {
	root := &api.LocalFileSystem{RootDir: s.RootDir}
	handler := func(ctx *api.Context) {
		fileName := ctx.Request.PathValue("fileName")
		file, err := root.Open(fileName, "index.html")

		if err != nil {
			ctx.Logger.Error(fmt.Sprintf("Failed to open file %q", fileName), "error", err)
			ctx.Response.Error(http.StatusInternalServerError)
			return
		}

		if file == nil {
			ctx.Response.Error(http.StatusNotFound)
			return
		}

		defer file.Close()

		if strings.HasPrefix(file.Name(), "assets/") {
			ctx.Response.Header().Set("Cache-Control", "public, max-age=31536000, immutable")
		} else {
			ctx.Response.Header().Set("Cache-Control", "no-cache")
		}

		ctx.Response.WriteFileContent(file.Name(), file.Info().ModTime(), file)
	}

	return &api.Route{
		Pattern: "/{fileName...}",
		Handler: handler,
	}
}

package handler

import (
	"net/http"
	"strings"

	"seahax.com/go/serve/server"
)

func Serve(root http.Dir, response *server.Response, request *http.Request) {
	if request.Method != http.MethodGet {
		response.Header().Set("Allow", http.MethodGet)
		response.WriteHeader(http.StatusMethodNotAllowed)
		return
	}

	filename := request.URL.Path

	if !strings.HasPrefix(filename, "/") {
		filename = "/" + filename
	}

	if strings.HasSuffix(filename, "/") {
		response.WriteHeader(http.StatusNotFound)
		return
	}

	file, err := root.Open(filename)

	if err != nil {
		response.WriteHeader(http.StatusNotFound)
		return
	}

	defer file.Close()
	fileInfo, err := file.Stat()

	if err != nil || fileInfo.IsDir() {
		response.WriteHeader(http.StatusNotFound)
		return
	}

	http.ServeContent(response, request, filename, fileInfo.ModTime(), file)
}

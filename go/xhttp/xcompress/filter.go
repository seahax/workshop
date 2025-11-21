package xcompress

import (
	"net/http"
	"strings"
)

type Filter func(request *http.Request) bool

// Default filter function which applies compression to text/* and
// application/* content types.
func DefaultFilter(request *http.Request) bool {
	contentType := request.Header.Get("Content-Type")

	return strings.HasPrefix(contentType, "text/") ||
		strings.HasPrefix(contentType, "application/")
}

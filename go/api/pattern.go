package api

import (
	"path"
	"strings"
)

// A parsed ServeMux route pattern.
type Pattern struct {
	Method string
	Domain string
	Path   string
}

// Return the string representation of the parsed pattern.
func (p *Pattern) String() string {
	var pattern string

	if p.Method != "" {
		pattern = p.Method + " "
	}

	pattern += path.Join(p.Domain, "/", p.Path)

	// The [path.Join] function removes trailing slashes. But, a trailing slash
	// has a special meaning for [net/http.Mux] patterns. So, if the original
	// path had a trailing slash, preserve it.
	if strings.HasSuffix(p.Path, "/") && !strings.HasSuffix(pattern, "/") {
		pattern += "/"
	}

	return pattern
}

// Parse a ServeMux route pattern string.
func ParsePattern(pattern string) *Pattern {
	var method, domain, path string

	pattern = strings.TrimSpace(pattern)
	spaceIndex := strings.IndexAny(pattern, " \t")

	if spaceIndex != -1 {
		method = pattern[:spaceIndex]
		pattern = strings.TrimSpace(pattern[spaceIndex+1:])
	}

	slashIndex := strings.Index(pattern, "/")

	if slashIndex != -1 {
		domain = strings.TrimSpace(pattern[:slashIndex])
		path = strings.TrimSpace(pattern[slashIndex:])
	} else {
		domain = strings.TrimSpace(pattern)
	}

	return &Pattern{
		Method: method,
		Domain: domain,
		Path:   path,
	}
}

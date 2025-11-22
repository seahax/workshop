package xhttp

import (
	"path"
	"strings"

	"seahax.com/go/shorthand"
)

// Parsed [net/http.ServeMux] route pattern into component parts.
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

	pattern += PatternPathJoin(p.Domain, "/", p.Path)

	return pattern
}

// Parse a [net/http.ServeMux] route pattern string into its component parts.
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

// Create a pattern string from method, domain, and path components.
func PatternString(method, domain string, paths ...string) string {
	return (&Pattern{
		Method: method,
		Domain: domain,
		Path:   PatternPathJoin(paths...),
	}).String()
}

// Works like [path.Join], but maintains trailing slashes because they have a
// special meaning for [net/http.Mux] patterns.
func PatternPathJoin(paths ...string) string {
	value := path.Join(paths...)

	if strings.HasSuffix(shorthand.Last(paths), "/") {
		value += "/"
	}

	return value
}

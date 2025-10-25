package api

import (
	"regexp"
	"strings"
)

var rxPattern = regexp.MustCompile(`^(?:([ \t]+)[ \t]+)?([^/]+)?(/.*)?$`)

func parsePattern(pattern string) (method string, domain string, path string) {
	m := rxPattern.FindStringSubmatch(pattern)

	return m[1], m[2], m[3]
}

func createPattern(method string, domain string, path string) string {
	var pattern strings.Builder

	if method != "" {
		pattern.WriteString(method)
		pattern.WriteString(" ")
	}

	if domain != "" {
		pattern.WriteString(domain)
	}

	if path != "" {
		pattern.WriteString(path)
	}

	return pattern.String()
}

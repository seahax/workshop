package shorthand

import (
	"regexp"
)

var multilinePrefix = regexp.MustCompile(`(?:(^|\n)\s*\| ?|\n\s*$)`)

// Define a multiline string with indentation using | prefixed lines.
//
//  shorthand.Multiline(`
//    | line 1 (no indent)
//    |   line 2 (2 space indent)
//    |     line 3 (4 space indent)
//  `)
//
// There should be an initial newline. Each line should start with the same
// number of whitespaces (indent), followed by a | character and one space.
func Multiline(value string) string {
	value = multilinePrefix.ReplaceAllString(value, `$1`)
	return value
}

package publish

import (
	"mime"
)

// Common Content-Types by file extension. The Go core mime package is
// system-dependent. This provides a consistent baseline across platforms.
//
//   - https://github.com/nginx/nginx/blob/master/conf/mime.types
//   - https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/MIME_types/Common_types
var contentTypesByExt = map[string]string{
	// Text
	".html": "text/html; charset=utf-8",
	".htm":  "text/html; charset=utf-8",
	".css":  "text/css; charset=utf-8",
	".txt":  "text/plain; charset=utf-8",
	".md":   "text/markdown; charset=utf-8",
	".js":   "application/javascript; charset=utf-8",
	".mjs":  "application/javascript; charset=utf-8",
	".json": "application/json; charset=utf-8",
	".xml":  "application/xml",
	// Images
	".png":  "image/png",
	".jpg":  "image/jpeg",
	".jpeg": "image/jpeg",
	".gif":  "image/gif",
	".svg":  "image/svg+xml",
	".svgz": "image/svg+xml",
	".webp": "image/webp",
	".ico":  "image/x-icon",
	".bmp":  "image/bmp",
	".tiff": "image/tiff",
	".tif":  "image/tiff",
	".avif": "image/avif",
	// Fonts
	".otf":   "font/otf",
	".ttf":   "font/ttf",
	".woff":  "font/woff",
	".woff2": "font/woff2",
}

// Get Content-Type by file extension (including leading dot).
func ContentTypeByExtension(ext string) string {
	contentType := contentTypesByExt[ext]

	if contentType == "" {
		// Fallback to the system-dependent Go core mime package.
		contentType = mime.TypeByExtension(ext)
	}

	if contentType == "" {
		// If all else fails, treat as binary data.
		contentType = "application/octet-stream"
	}

	return contentType
}

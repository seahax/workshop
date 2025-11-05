package static

import (
	"errors"
	"io/fs"
	"os"
	"path"
	"strings"

	"seahax.com/go/shorthand"
)

type rootFS struct {
	// Directory on the local filesystem to serve files from. Default is the
	// current working directory.
	RootDir string
	// If true, dotfiles (files or directories starting with a period) are
	// allowed to be served. Default is false.
	AllowDotFiles bool
}

// Open and return the first file that exists and is readable  from the
// provided list of file names. If none of the files exist, the returned
// error will be [io/fs.ErrNotExist]. If a file exists but cannot be opened,
// the error is returned immediately, and no further files are tried.
func (l *rootFS) Open(fileNames ...string) (*result, error) {
	rootDir := shorthand.Coalesce(l.RootDir, ".")
	root, err := os.OpenRoot(rootDir)

	if err != nil {
		return nil, err
	}

	defer root.Close()

	for _, fileName := range fileNames {
		if fileName == "" || strings.HasSuffix(fileName, "/") {
			continue
		}

		// Treat all paths as relative to the root dir, even if they are absolute.
		fileName = path.Join(".", fileName)

		if !l.AllowDotFiles && (strings.HasPrefix(fileName, ".") || strings.Contains(fileName, "/.")) {
			continue
		}

		file, err := root.Open(fileName)

		if errors.Is(err, fs.ErrNotExist) {
			continue
		}

		if err != nil {
			// HACK: Check for path escaping error. Go should really make this a
			// specific error we can check for.
			if strings.Contains(err.Error(), "path escapes from parent") {
				continue
			}

			return nil, err
		}

		fileInfo, err := file.Stat()

		if err != nil {
			file.Close()
			return nil, err
		}

		if fileInfo.IsDir() {
			file.Close()
			continue
		}

		return &result{
			File: file,
			Name: fileName,
			Info: fileInfo,
		}, nil
	}

	return nil, fs.ErrNotExist
}

type result struct {
	File *os.File
	Name string
	Info fs.FileInfo
}

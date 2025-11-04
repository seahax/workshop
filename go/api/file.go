package api

import (
	"errors"
	"io"
	"io/fs"
	"os"
	"path"
	"strings"
)

// Provides access to local filesystem files with path traversal and dotfile
// protection.
type LocalFileSystem struct {
	RootDir       string
	AllowDotFiles bool
}

// Open and return the first file that exists and is readable  from the
// provided list of file names. If none of the files exist, the returned
// error will be [io/fs.ErrNotExist]. If a file exists but cannot be opened,
// the error is returned immediately, and no further files are tried.
func (l *LocalFileSystem) Open(fileNames ...string) (*LocalFile, error) {
	root, err := os.OpenRoot(l.RootDir)

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

		return &LocalFile{
			ReadSeekCloser: file,
			Name:           fileName,
			Info:           fileInfo,
		}, nil
	}

	return nil, fs.ErrNotExist
}

type LocalFile struct {
	io.ReadSeekCloser
	Name string
	Info fs.FileInfo
}

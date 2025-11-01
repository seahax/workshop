package api

import (
	"errors"
	"io"
	"io/fs"
	"os"
	"path"
	"strings"
)

// An [net/http.File] compatible file that also provides the file name and file
// information.
type File interface {
	io.ReadSeekCloser
	Name() string
	Info() fs.FileInfo
}

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
func (l *LocalFileSystem) Open(fileNames ...string) (File, error) {
	root, err := os.OpenRoot(l.RootDir)

	if err != nil {
		return nil, err
	}

	for _, fileName := range fileNames {
		if fileName == "" || strings.HasSuffix(fileName, "/") {
			continue
		}

		// Treat all paths as relative to the root dir, even if they are absolute.
		fileName = path.Join(".", fileName)

		if !l.AllowDotFiles && (strings.HasPrefix(fileName, ".") || strings.Contains(fileName, "/.")) {
			continue
		}

		f, err := root.Open(fileName)

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

		i, err := f.Stat()

		if err != nil {
			f.Close()
			return nil, err
		}

		if i.IsDir() {
			f.Close()
			continue
		}

		file := &localFile{
			ReadSeekCloser: f,
			root:           root,
			name:           fileName,
			info:           i,
		}

		return file, nil
	}

	return nil, fs.ErrNotExist
}

type localFile struct {
	io.ReadSeekCloser
	root *os.Root
	name string
	info fs.FileInfo
}

func (fs *localFile) Name() string {
	return fs.name
}

func (fs *localFile) Info() fs.FileInfo {
	return fs.info
}

func (fs *localFile) Close() error {
	return errors.Join(
		fs.ReadSeekCloser.Close(),
		fs.root.Close(),
	)
}

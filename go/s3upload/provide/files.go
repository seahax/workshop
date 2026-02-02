package provide

import (
	"fmt"
	"os"
	"path/filepath"
)

// Content that provides a limited set of files in a directory. S3 object keys
// are the file paths relative to the directory.
type FilesContent struct {
	// The absolute path of the directory containing the files to upload.
	Root string
	// The list of file paths to upload, relative to the Root directory.
	Paths []string
}

// Create a new [FilesContent] instance.
func Files(root string, paths ...string) *FilesContent {
	return &FilesContent{
		Root:  root,
		Paths: paths,
	}
}

// Implements the [seahax.com/go/s3upload/publish.Content] interface.
func (f *FilesContent) PublishTo(uploader Uploader) error {
	root, err := os.OpenRoot(f.Root)

	if err != nil {
		return err
	}

	defer root.Close()

	for _, relPath := range f.Paths {
		if err := uploadOne(uploader, root, relPath); err != nil {
			return err
		}
	}

	return nil
}

func uploadOne(uploader Uploader, root *os.Root, relPath string) error {
	file, err := root.Open(relPath)

	if err != nil {
		return err
	}

	defer file.Close()
	info, err := file.Stat()

	if err != nil {
		return err
	}

	if !info.Mode().IsRegular() {
		return fmt.Errorf("not a regular file: %s", relPath)
	}

	key := filepath.ToSlash(relPath)
	return uploader.Upload(key, file)
}

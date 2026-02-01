package provide

import (
	"fmt"
	"os"
	"path/filepath"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/s3"
)

// [Content] that provides a limited set of files in a directory. S3 object keys
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

// Implements the [Content.PublishTo] method.
func (f *FilesContent) PublishTo(publisher ContentPublisher) error {
	root, err := os.OpenRoot(f.Root)

	if err != nil {
		return err
	}

	defer root.Close()

	for _, relPath := range f.Paths {
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

		if err = publisher.PutObject(&s3.PutObjectInput{
			Key:  aws.String(filepath.ToSlash(relPath)),
			Body: file,
		}); err != nil {
			return err
		}
	}

	return nil
}

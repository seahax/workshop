package provide

import (
	"os"
	"path/filepath"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/s3"
)

// [Content] that provides a limited set of files in a directory. S3 object keys
// are the file paths relative to the directory.
type Files struct {
	// The absolute path of the directory containing the files to upload.
	Root string
	// The list of file paths to upload, relative to the Root directory.
	Paths []string
}

func (f *Files) PublishTo(publisher ContentPublisher) error {
	absRoot, err := filepath.Abs(f.Root)

	if err != nil {
		return err
	}

	root, err := os.OpenRoot(absRoot)

	if err != nil {
		return err
	}

	defer root.Close()

	for _, filePath := range f.Paths {
		file, err := root.Open(filePath)

		if err != nil {
			return err
		}

		if err = publisher.PutObject(&s3.PutObjectInput{
			Key:  aws.String(filepath.ToSlash(filePath)),
			Body: file,
		}); err != nil {
			return err
		}
	}

	return nil
}

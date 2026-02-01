package provide

import (
	"io/fs"
	"os"
	"path/filepath"
	"slices"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/s3"
)

// [Content] that provides all files in a directory, with optional filtering. S3
// object keys are the file paths relative to the directory.
type Directory struct {
	// The absolute path of the directory containing the files to upload.
	Root string
	// Filters to include files. If empty, all files are included by default.
	Include []DirectoryFilter
	// Filters to exclude files. Applied to files passing the Include filters.
	Exclude []DirectoryFilter
}

type DirectoryFilterEntry struct {
	fs.DirEntry
	// Absolute starting directory path.
	Root string
	// File or directory path relative to the Root directory.
	Path string
}

type DirectoryFilter = func(entry *DirectoryFilterEntry) bool

func (d *Directory) PublishTo(publisher ContentPublisher) error {
	absRoot, err := filepath.Abs(d.Root)

	if err != nil {
		return err
	}

	return filepath.WalkDir(absRoot, func(absPath string, dirent fs.DirEntry, err error) error {
		if err != nil {
			return err
		}

		relPath, err := filepath.Rel(absRoot, absPath)

		if relPath == "." || err != nil {
			return err
		}

		entry := &DirectoryFilterEntry{DirEntry: dirent, Root: absRoot, Path: relPath}
		included := len(d.Include) == 0 || slices.ContainsFunc(d.Include, func(filter DirectoryFilter) bool {
			return filter(entry)
		})
		excluded := !included || slices.ContainsFunc(d.Exclude, func(filter DirectoryFilter) bool {
			return filter(entry)
		})

		if excluded {
			if dirent.IsDir() {
				return fs.SkipDir
			}

			return nil
		}

		if dirent.Type().IsRegular() {
			body, err := os.Open(absPath)

			if err != nil {
				return err
			}

			return publisher.PutObject(&s3.PutObjectInput{
				Key:  aws.String(filepath.ToSlash(relPath)),
				Body: body,
			})
		}

		return nil
	})
}

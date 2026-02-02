package provide

import (
	"io/fs"
	"os"
	"path/filepath"
)

// Content that provides all files in a directory, with optional filtering. S3
// object keys are the file paths relative to the directory.
type DirectoryContent struct {
	// The absolute path of the directory containing the files to upload.
	Root string
	// Filters to include or exclude files. If there are no include filters, then
	// all files are included by default.
	Filters []DirectoryFilter
}

// Include or exclude files based on custom logic.
type DirectoryFilter struct {
	Fn      DirectoryFilterFn
	Include bool
}

type DirectoryFilterFn = func(entry *DirectoryFilterEntry) bool

// Extended [fs.DirEntry] with additional path information, for use in
// directory filters.
type DirectoryFilterEntry struct {
	fs.DirEntry
	// Absolute starting directory path.
	Root string
	// File or directory path relative to the Root directory.
	Path string
}

// Create a new [DirectoryContent] instance.
func Directory(root string, filters ...DirectoryFilter) *DirectoryContent {
	return &DirectoryContent{
		Root:    root,
		Filters: filters,
	}
}

// Helper to create an include filter.
func DirectoryInclude(fn DirectoryFilterFn) DirectoryFilter {
	return DirectoryFilter{Fn: fn, Include: true}
}

// Helper to create an exclude filter.
func DirectoryExclude(fn DirectoryFilterFn) DirectoryFilter {
	return DirectoryFilter{Fn: fn, Include: false}
}

// Implements the [seahax.com/go/s3upload/publish.Content] interface.
func (d *DirectoryContent) PublishTo(uploader Uploader) error {
	root, err := os.OpenRoot(d.Root)

	if err != nil {
		return err
	}

	defer root.Close()

	return fs.WalkDir(root.FS(), ".", func(relPath string, dirent fs.DirEntry, err error) error {
		if err != nil {
			return err
		}

		if !dirent.Type().IsRegular() {
			// Skip everything but regular files.
			return nil
		}

		hasIncludes := false
		included := true // Include everything by default
		entry := &DirectoryFilterEntry{DirEntry: dirent, Root: d.Root, Path: relPath}

		for _, filter := range d.Filters {
			if filter.Include && !hasIncludes {
				hasIncludes = true
				included = false // No default includes if there are explicit includes
			}

			if filter.Fn(entry) {
				if filter.Include {
					included = true
				} else {
					return nil // Return early on exclude
				}
			}
		}

		if !included {
			return nil
		}

		body, err := root.Open(relPath)

		if err != nil {
			return err
		}

		defer body.Close()
		key := filepath.ToSlash(relPath)
		return uploader.Upload(key, body)
	})
}

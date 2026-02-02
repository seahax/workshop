package publish

import (
	"fmt"
	"path"
	"strings"

	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/aws/aws-sdk-go-v2/service/s3/types"
)

// Modify the [uploader] instance.
//
// Options should be designed to make changes only when an earlier option
// (possible the same option given twice) has not already made the change. For
// instance, the [WithContentType] option only sets the Content-Type if it is
// not already set.
type Option func(uploader *Uploader)

// Enable dry-run mode, which will skip uploading to S3.
func WithDryRun(enabled bool) Option {
	if !enabled {
		return func(_ *Uploader) {}
	}

	return func(uploader *Uploader) {
		uploader.DryRun = true
	}
}

// Add a prefix to every S3 object key.
func WithPrefix(prefix string) Option {
	if prefix == "" {
		return func(_ *Uploader) {}
	}

	return func(u *Uploader) {
		u.Middlewares = append(u.Middlewares, func(input *s3.PutObjectInput, next UploaderNext) error {
			input.Key = toPtr(path.Join(prefix, fromPtr(input.Key)))
			return next(input)
		})
	}
}

// Set S3 object Content-Type based on the key extension. No-op if already set.
func WithContentType() Option {
	return func(u *Uploader) {
		u.Middlewares = append(u.Middlewares, func(input *s3.PutObjectInput, next UploaderNext) error {
			if input.ContentType == nil {
				ext := strings.ToLower(path.Ext(fromPtr(input.Key)))
				input.ContentType = toPtr(ContentTypeByExtension(ext))
			}

			return next(input)
		})
	}
}

// Set S3 object Cache-Control. No-op if already set.
func WithCacheControl[T ~string | func(key string) string](value T) Option {
	return func(u *Uploader) {
		u.Middlewares = append(u.Middlewares, func(input *s3.PutObjectInput, next UploaderNext) error {
			if input.CacheControl == nil {
				var cacheControl string

				if fn, ok := any(value).(func(key string) string); ok {
					cacheControl = fn(fromPtr(input.Key))
				} else {
					cacheControl = string(any(value).(string))
				}

				if cacheControl != "" {
					input.CacheControl = toPtr(cacheControl)
				}
			}

			return next(input)
		})
	}
}

// Set S3 object storage class. No-op if already set.
func WithStorageClass[T ~string](storageClass T) Option {
	return func(u *Uploader) {
		u.Middlewares = append(u.Middlewares, func(input *s3.PutObjectInput, next UploaderNext) error {
			if input.StorageClass == "" {
				input.StorageClass = types.StorageClass(storageClass)
			}

			return next(input)
		})
	}
}

// Print each S3 object key to stdout after uploading.
func WithPrint(enabled bool) Option {
	if !enabled {
		return func(_ *Uploader) {}
	}

	return func(u *Uploader) {
		u.Uploaded = append(u.Uploaded, func(output *UploadOutput) {
			infos := []string{}
			info := ""

			if (output.ETag) != "" {
				infos = append(infos, fmt.Sprintf("ETag: %s", output.ETag))
			}

			if output.VersionID != "" {
				infos = append(infos, fmt.Sprintf("VersionID: %s", output.VersionID))
			}

			if len(infos) > 0 {
				info = " (" + strings.Join(infos, ", ") + ")"
			}

			fmt.Printf("%s%s\n", output.Key, info)
		})
	}
}

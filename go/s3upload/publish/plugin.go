package publish

import (
	"fmt"
	"path"
	"strings"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/aws/aws-sdk-go-v2/service/s3/types"
)

// Modify the [s3.PutObjectInput] before it is published.
//
// NOTE: Changing the [s3.PutObjectInput.Body] has no effect, because it is set
// after plugins are applied.
type Plugin func(input *s3.PutObjectInput) error

// Add a prefix to every S3 object key.
func WithPrefix(prefix string) Plugin {
	if prefix == "" {
		return noopPlugin
	}

	return func(input *s3.PutObjectInput) error {
		input.Key = aws.String(path.Join(prefix, aws.ToString(input.Key)))
		return nil
	}
}

// Set S3 object Content-Type based on the key extension. No-op if already set.
func WithContentType() Plugin {
	return func(input *s3.PutObjectInput) error {
		if input.ContentType == nil {
			ext := strings.ToLower(path.Ext(aws.ToString(input.Key)))
			input.ContentType = aws.String(ContentTypeByExtension(ext))
		}

		return nil
	}
}

// Set S3 object Cache-Control. No-op if already set.
func WithCacheControl[T ~string | func(key string) string](value T) Plugin {
	return func(input *s3.PutObjectInput) error {
		if input.CacheControl == nil {
			var cacheControl string

			if fn, ok := any(value).(func(key string) string); ok {
				cacheControl = fn(aws.ToString(input.Key))
			} else if value, ok := any(value).(string); ok {
				cacheControl = string(value)
			}

			if cacheControl != "" {
				input.CacheControl = aws.String(cacheControl)
			}
		}

		return nil
	}
}

// Set S3 object storage class. No-op if already set.
func WithStorageClass[T ~string](storageClass T) Plugin {
	return func(input *s3.PutObjectInput) error {
		if input.StorageClass == "" {
			input.StorageClass = types.StorageClass(storageClass)
		}

		return nil
	}
}

// Print each S3 object key to stdout before uploading.
func WithPrint(enabled bool) Plugin {
	if !enabled {
		return noopPlugin
	}

	return func(input *s3.PutObjectInput) error {
		fmt.Println(aws.ToString(input.Key))
		return nil
	}
}

func noopPlugin(_ *s3.PutObjectInput) error {
	return nil
}

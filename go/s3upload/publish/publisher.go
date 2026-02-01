package publish

import (
	"context"
	"io"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/feature/s3/manager"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"seahax.com/go/s3upload/provide"
)

// AWS SDK [manager.Uploader] wrapper that enables publishing [provide.Content]
// items to a specific S3 bucket, with [Plugin] support.
type Publisher struct {
	// Skip uploading.
	DryRun bool
	// Underlying AWS SDK S3 [manager.Uploader].
	Uploader Uploader
	// Target S3 bucket name.
	Bucket string
	// Plugins to modify S3 object inputs before upload.
	Plugins []Plugin
}

// Partial AWS SDK [manager.Uploader] interface.
type Uploader interface {
	Upload(
		ctx context.Context,
		input *s3.PutObjectInput,
		options ...func(*manager.Uploader),
	) (*manager.UploadOutput, error)
}

// Publishes the given [provide.Content].
func (p *Publisher) Publish(content provide.Content) error {
	return content.PublishTo(p)
}

// Put an object into the S3 bucket.
func (p *Publisher) PutObject(input *s3.PutObjectInput) error {
	body := input.Body

	if closer, ok := body.(io.Closer); ok {
		defer closer.Close()
	}

	for _, plugin := range p.Plugins {
		err := plugin(input)

		if err != nil {
			return err
		}

		if body != input.Body {
			body = input.Body

			if closer, ok := body.(io.Closer); ok {
				closer.Close()
			}
		}
	}

	input.Bucket = aws.String(p.Bucket)

	if p.DryRun {
		return nil
	}

	_, err := p.Uploader.Upload(context.TODO(), input)

	return err
}

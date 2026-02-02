package publish

import (
	"context"
	"io"
	"slices"

	"github.com/aws/aws-sdk-go-v2/feature/s3/manager"
	"github.com/aws/aws-sdk-go-v2/service/s3"
)

// Implementation of the [seahax.com/go/s3upload/provide.Uploader] interface.
//
// Intended for internal use. [Publisher] creates an instance each time the
// [Publisher.Publish] method is called.
type Uploader struct {
	// AWS SDK S3 Uploader used to perform uploads.
	AwsS3ManagerUploader awsS3ManagerUploader
	// Name of the S3 bucket where objects will be uploaded.
	Bucket string
	// Skip uploading if true.
	DryRun bool
	// Functions that modify the [s3.PutObjectInput] before upload.
	//
	// NOTE: Changing the [s3.PutObjectInput.Bucket] has no effect, because it is
	// set after middleware is applied.
	Middlewares []UploaderMiddleware
	// Callbacks invoked after each successful upload.
	Uploaded []func(output *UploadOutput)
}

// Middlware function that intercepts the [s3.PutObjectInput] before upload. It
// can optionally modify the input, and then optionally call the next next
// middleware in the chain.
type UploaderMiddleware func(input *s3.PutObjectInput, next UploaderNext) error

// Function that invokes the next middleware in the middleware chain.
type UploaderNext func(input *s3.PutObjectInput) error

// Upload result information.
type UploadOutput struct {
	Key       string
	ETag      string
	VersionID string
}

// Internal partial AWS SDK [manager.awsS3ManagerUploader] interface. Reduces
// coupling to the AWS SDK so that future updates are easier.
type awsS3ManagerUploader interface {
	Upload(
		ctx context.Context,
		input *s3.PutObjectInput,
		options ...func(*manager.Uploader),
	) (*manager.UploadOutput, error)
}

// Upload a key/body pair to S3.
func (u *Uploader) Upload(key string, body io.Reader) error {
	// Head of the recursive middleware chain.
	doUpload := u.doUpload

	// Convert the middlware into a recursive chain, where each middleware calls
	// the next one, starting with the first middleware, and ending with the
	// actual upload. The doUpload function is replaced at each step with a
	// wrapper that calls a middleware with the previous doUpload function value
	// as the next function.
	for _, middleware := range slices.Backward(u.Middlewares) {
		next := doUpload
		doUpload = func(input *s3.PutObjectInput) error {
			return middleware(input, next)
		}
	}

	return doUpload(&s3.PutObjectInput{Key: toPtr(key), Body: body})
}

// Final link in the middleware chain that performs the actual upload.
//
//   - Sets the bucket name to avoid middleware redirecting uploads to a different bucket.
//   - Enforces the DryRun setting.
//   - Runs Uploaded callbacks after a successful uploads.
func (u *Uploader) doUpload(input *s3.PutObjectInput) error {
	input.Bucket = toPtr(u.Bucket)

	var output *UploadOutput
	var err error

	if u.DryRun {
		output = &UploadOutput{Key: fromPtr(input.Key)}
	} else {
		uploaderOutput, uploaderErr := u.AwsS3ManagerUploader.Upload(context.TODO(), input)

		if uploaderErr == nil {
			output = &UploadOutput{
				Key:       fromPtr(uploaderOutput.Key),
				ETag:      fromPtr(uploaderOutput.ETag),
				VersionID: fromPtr(uploaderOutput.VersionID),
			}
		} else {
			err = uploaderErr
		}
	}

	if err == nil {
		for _, callback := range u.Uploaded {
			callback(output)
		}
	}

	return err
}

package publish

// An extension of the AWS SDK S3 [manager.Uploader] that publishes abstract
// [Content] items, with [Option] plugins to modify uploads. Individual content
// items may upload multiple S3 objects when published.
type Publisher struct {
	// AWS SDK S3 Uploader used to perform uploads.
	AwsS3ManagerUploader awsS3ManagerUploader
	// Name of the S3 bucket where objects will be uploaded.
	Bucket string
	// Options shared across all publish operations. These options are
	// applied after any options passed to the [Publisher.Publish] method.
	Options []Option
}

// Create a new [Publisher] instance.
func NewPublisher(uploader awsS3ManagerUploader, bucket string, options ...Option) *Publisher {
	return &Publisher{AwsS3ManagerUploader: uploader, Bucket: bucket, Options: options}
}

// Publish the [Content]. Options passed to this method are applied BEFORE
// [Publisher] instance options.
//
// Creates a new [Uploader], applies options to it, and then passes it to the
// [Content.PublishTo] method so that the content can upload itself.
func (p *Publisher) Publish(content Content, options ...Option) error {
	uploader := &Uploader{AwsS3ManagerUploader: p.AwsS3ManagerUploader, Bucket: p.Bucket}

	// Apply options to the uploader.
	for _, option := range append(options, p.Options...) {
		option(uploader)
	}

	return content.PublishTo(uploader)
}

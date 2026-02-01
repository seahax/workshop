package provide

import "github.com/aws/aws-sdk-go-v2/service/s3"

// Type that can publish itself using a [ContentPublisher].
type Content interface {
	PublishTo(publisher ContentPublisher) error
}

// Type that can put object into S3.
type ContentPublisher interface {
	PutObject(input *s3.PutObjectInput) error
}

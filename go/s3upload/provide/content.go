package provide

import "github.com/aws/aws-sdk-go-v2/service/s3"

// Type that can publish itself using a [Publisher].
type Content interface {
	PublishTo(publisher ContentPublisher) error
}

type ContentPublisher interface {
	PutObject(input *s3.PutObjectInput) error
}

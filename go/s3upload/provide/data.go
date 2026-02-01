package provide

import (
	"bytes"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/s3"
)

// [Content] from raw data (bytes).
type Data struct {
	// S3 object key.
	Key string
	// Data bytes.
	Data []byte
}

func (d *Data) PublishTo(publisher ContentPublisher) error {
	return publisher.PutObject(&s3.PutObjectInput{
		Key:  aws.String(d.Key),
		Body: bytes.NewReader(d.Data),
	})
}

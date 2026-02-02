package publish

import "seahax.com/go/s3upload/provide"

// Abstact type for provided content that can publish itself to an [Uploader].
type Content interface {
	PublishTo(uploader provide.Uploader) error
}

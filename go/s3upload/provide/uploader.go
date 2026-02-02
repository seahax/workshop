package provide

import "io"

// Abstract type that can be used to upload key/body pairs.
//
// This interface is the connection point between this package and the
// [seahax.com/go/s3upload/publish] package. The publish package injects an
// implementation of this interface into the PublishTo(Uploader) methods in
// this package.
type Uploader interface {
	Upload(key string, body io.Reader) error
}

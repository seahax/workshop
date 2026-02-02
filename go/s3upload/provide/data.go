package provide

import (
	"bytes"
	"io"
)

// Content that provides content from in-memory data.
type DataContent[T []byte | func() (io.ReadCloser, error)] struct {
	// S3 object key.
	Key string
	// Data as bytes or a function that opens and returns a reader.
	Data T
}

// Create a new [DataContent] instance.
func Data[T []byte | func() (io.ReadCloser, error)](key string, data T) *DataContent[T] {
	return &DataContent[T]{Key: key, Data: data}
}

// Implements the [seahax.com/go/s3upload/publish.Content] interface.
func (d *DataContent[T]) PublishTo(uploader Uploader) error {
	var reader io.ReadCloser
	var err error

	if open, ok := any(d.Data).(func() (io.ReadCloser, error)); ok {
		reader, err = open()
	} else {
		reader = io.NopCloser(bytes.NewReader(any(d.Data).([]byte)))
	}

	if err != nil {
		return err
	}

	defer reader.Close()

	return uploader.Upload(d.Key, reader)
}

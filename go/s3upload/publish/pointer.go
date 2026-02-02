package publish

import "reflect"

// Utilities that avoid the extra "github.com/aws/aws-sdk-go-v2/aws" import,
// which reduces the direct dependencies, which makes it easier to update
// later.

// Create a pointer to a value COPY. Passing the value to the function copies
// it, so the pointer is not to the variable passed by the caller. This is
// intentional, because the AWS SDK doesn't want pointers for modification,
// just to differentiate between values that are set, and values that are just
// defaulted to their zero value.
func toPtr[T any](v T) *T {
	return &v
}

// Return the value referenced by the pointer, or else the zero value.
func fromPtr[T any](p *T) T {
	if p == nil {
		return reflect.Zero(reflect.TypeFor[T]()).Interface().(T)
	}

	return *p
}

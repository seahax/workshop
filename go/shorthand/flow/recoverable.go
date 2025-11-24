package flow

type recoverable error

// Returns an error and true if the recovered value is a [flow.recoverable]
// error.
//
// [flow.recoverable]: https://pkg.go.dev/go/shorthand/flow#recoverable
func IsRecoverable(recovered any) (error, bool) {
	if r, ok := recovered.(recoverable); ok {
		return error(r), true
	}

	return nil, false
}

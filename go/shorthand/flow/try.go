package flow

// Using Try should ALWAYS be paired with a deferred call to Recover in the
// same function.
//
// Try an operation that may return an error. If the error is non-nil, it
// panics with a recoverable error wrapping the original error, which should be
// recovered using the [Recover] function.
//
// Example:
//
//	func DoSomething() (err error) {
//	  defer flow.Recover(&err)
//	  flow.Try(SomeOperation())
//	  return nil
//	}
//
// [Recover]: https://pkg.go.dev/go/shorthand/flow#Recover
func Try(err error) {
	if err != nil {
		panic(recoverable(err))
	}
}

// Using TryValue should ALWAYS be paired with a deferred call to Recover in
// the same function.
//
// Try an operation that may return a value or an error. If the error is
// non-nil, it panics with a recoverable error wrapping the original error,
// which should be recovered using the [Recover] function.
//
// Example:
//
//	func DoSomething() (value string, err error) {
//	  defer flow.Recover(&err)
//	  value := flow.Try(SomeOperation())
//	  return flow.Ok(value)
//	}
//
// [Recover]: https://pkg.go.dev/go/shorthand/flow#Recover
func TryValue[T any](value T, err error) T {
	Try(err)
	return value
}

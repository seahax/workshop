package flow

// Deferred recovery function which sets the named error return value if [Try]
// or [TryValue] encounters an error.
//
// Example:
//
//	func DoSomething() (result string, err error) {
//	  defer flow.Recover(&err)
//	  flow.Try(SomeOperation())
//	  value := flow.TryValue(SomeOtherOperation())
//	  return flow.Ok(value)
//	}
//
// [Try]: https://pkg.go.dev/go/shorthand/flow#Try
// [TryValue]: https://pkg.go.dev/go/shorthand/flow#TryValue
func Recover(err *error) {
	if r := recover(); r != nil {
		if e, ok := IsRecoverable(r); ok {
			(*err) = e
			return
		}

		panic(r)
	}
}

package shorthand

// Helper for returning a zero value and an error.
func Fail[T any](err error) (T, error) {
	return Zero[T](), err
}

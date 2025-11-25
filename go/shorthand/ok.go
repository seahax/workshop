package shorthand

// Helper for returning a value and a nil error.
func Ok[T any](value T) (T, error) {
	return value, nil
}

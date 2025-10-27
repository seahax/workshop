package shorthand

// Return the first element of a slice, or the zero value if the slice is
// empty.
func First[T any](values []T) T {
	if len(values) == 0 {
		var zero T
		return zero
	}

	return values[0]
}

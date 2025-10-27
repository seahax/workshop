package shorthand

// Return the last element of a slice, or the zero value if the slice is
// empty.
func Last[T any](values []T) T {
	length := len(values)

	if length == 0 {
		var zero T
		return zero
	}

	return values[length-1]
}

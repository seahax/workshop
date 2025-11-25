package shorthand

// Return the first element of a slice, or the zero value if the slice is
// empty.
func First[T any](values []T) T {
	if len(values) == 0 {
		return Zero[T]()
	}

	return values[0]
}

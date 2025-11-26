package shorthand

// Return the last element of a slice and true, or the zero value and false if
// the slice is empty.
func Last[T any](values []T) (T, bool) {
	length := len(values)

	if length == 0 {
		return Zero[T](), false
	}

	return values[length-1], true
}

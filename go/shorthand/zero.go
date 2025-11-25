package shorthand

// Return the zero value for a given type.
func Zero[T any]() T {
	var zero T
	return zero
}

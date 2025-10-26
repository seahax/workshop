package shorthand

func Last[T any](values []T) T {
	length := len(values)

	if length == 0 {
		var zero T
		return zero
	}

	return values[length-1]
}

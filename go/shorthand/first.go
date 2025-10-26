package shorthand

func First[T any](values []T) T {
	if len(values) == 0 {
		var zero T
		return zero
	}

	return values[0]
}

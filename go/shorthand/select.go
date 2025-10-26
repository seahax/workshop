package shorthand

func Select[T any, V any](values []T, selector func(T) V) []V {
	result := make([]V, 0, len(values))

	for _, value := range values {
		result = append(result, selector(value))
	}

	return result
}

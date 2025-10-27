package shorthand

// Return a new slice containing the results of applying the selector function
// to each element of the input slice.
func Select[T any, V any](values []T, selector func(T) V) []V {
	result := make([]V, 0, len(values))

	for _, value := range values {
		result = append(result, selector(value))
	}

	return result
}

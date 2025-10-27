package shorthand

// Return a new slice containing only the elements that satisfy the predicate.
func Filter[T any](values []T, predicate func(T) bool) []T {
	result := make([]T, 0)

	for _, value := range values {
		if predicate(value) {
			result = append(result, value)
		}
	}

	return result
}

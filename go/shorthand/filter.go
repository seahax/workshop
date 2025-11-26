package shorthand

import (
	"iter"
	"maps"
	"slices"
)

// Return a new slice containing only the elements that satisfy the predicate.
func Filter[T any](values []T, predicate func(int, T) bool) []T {
	return slices.Collect(FilterSeq(slices.Values(values), predicate))
}

// Return a new map containing only the elements that satisfy the predicate.
func FilterMap[K comparable, V any](values map[K]V, predicate func(K, V) bool) map[K]V {
	return maps.Collect(FilterSeq2(maps.All(values), predicate))
}

// Return a new Seq that yields only the elements that satisfy the predicate.
func FilterSeq[T any](values iter.Seq[T], predicate func(int, T) bool) iter.Seq[T] {
	i := 0
	return func(yield func(T) bool) {
		for value := range values {
			if predicate(i, value) {
				if !yield(value) {
					return
				}
			}
			i++
		}
	}
}

// Return a new Seq2 that yields only the elements that satisfy the predicate.
func FilterSeq2[K, V any](values iter.Seq2[K, V], predicate func(K, V) bool) iter.Seq2[K, V] {
	return func(yield func(K, V) bool) {
		for key, value := range values {
			if predicate(key, value) {
				if !yield(key, value) {
					return
				}
			}
		}
	}
}

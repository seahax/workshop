package shorthand

import (
	"iter"
	"maps"
	"slices"
)

// Return a new slice containing the results of applying the selector function
// to each element of the input slice.
func Select[T1, T2 any](values []T1, selector func(int, T1) T2) []T2 {
	return slices.Collect(SelectSeq(slices.Values(values), selector))
}

// Return a new map containing the results of applying the selector function
// to each key-value pair of the input map.
func SelectMap[K1, K2 comparable, V1, V2 any](values map[K1]V1, selector func(K1, V1) (K2, V2)) map[K2]V2 {
	return maps.Collect(SelectSeq2(maps.All(values), selector))
}

// Return a new Seq that yields the results of applying the selector function
// to each element of the input Seq.
func SelectSeq[T1, T2 any](values iter.Seq[T1], selector func(int, T1) T2) iter.Seq[T2] {
	return func(yield func(T2) bool) {
		i := 0
		for value := range values {
			if !yield(selector(i, value)) {
				return
			}
			i++
		}
	}
}

// Return a new Seq2 that yields the results of applying the selector function
// to each key-value pair of the input Seq2.
func SelectSeq2[K1, V1, K2, V2 any](values iter.Seq2[K1, V1], selector func(K1, V1) (K2, V2)) iter.Seq2[K2, V2] {
	return func(yield func(K2, V2) bool) {
		for key, value := range values {
			k2, v2 := selector(key, value)
			if !yield(k2, v2) {
				return
			}
		}
	}
}

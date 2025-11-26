package shorthand

import (
	"iter"
	"slices"
)

// Return the first element of a slice, or the zero value if the slice is
// empty.
func First[T any](values []T) (T, bool) {
	return FirstSeq(slices.Values(values))
}

// Return the first element of a Seq, or the zero value if the Seq yields no
// elements.
func FirstSeq[T any](values iter.Seq[T]) (T, bool) {
	for value := range values {
		return value, true
	}

	return Zero[T](), false
}

// Return the first element of a Seq2 and true, or the element zero values and
// false if the Seq2 yields no elements.
func FirstSeq2[K, V any](values iter.Seq2[K, V]) (K, V, bool) {
	for key, value := range values {
		return key, value, true
	}

	return Zero[K](), Zero[V](), false
}

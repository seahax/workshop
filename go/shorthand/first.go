package shorthand

import (
	"iter"
	"slices"
)

// Return the first element of a slice and true, or the zero value and false if
// the slice is empty.
func First[T any](values []T) (T, bool) {
	return FirstSeq(slices.Values(values))
}

// Like First, but returns only the value (no bool).
func FirstValue[T any](values []T) T {
	value, _ := FirstSeq(slices.Values(values))
	return value
}

// Return the first element of a Seq and true, or the zero value and false if
// the Seq yields no elements.
func FirstSeq[T any](values iter.Seq[T]) (T, bool) {
	for value := range values {
		return value, true
	}

	return Zero[T](), false
}

// Like FirstSeq, but returns only the value (no bool).
func FirstSeqValue[T any](values iter.Seq[T]) T {
	value, _ := FirstSeq(values)
	return value
}

// Return the first element of a Seq2 and true, or the element zero values and
// false if the Seq2 yields no elements.
func FirstSeq2[K, V any](values iter.Seq2[K, V]) (K, V, bool) {
	for key, value := range values {
		return key, value, true
	}

	return Zero[K](), Zero[V](), false
}

// Like FirstSeq2, but returns only the key and value (no bool).
func FirstSeq2Value[K, V any](values iter.Seq2[K, V]) (K, V) {
	key, value, _ := FirstSeq2(values)
	return key, value
}

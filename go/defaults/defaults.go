package defaults

import (
	"cmp"
	"reflect"
)

func NonZeroOrDefault[T any](value T, defaultValue T) T {
	v := reflect.ValueOf(value)

	if !v.IsValid() || v.IsZero() {
		return defaultValue
	}

	return value
}

func PositiveOrDefault[T cmp.Ordered](value T, defaultValue T) T {
	var zero T

	if value <= zero {
		return defaultValue
	}

	return value
}

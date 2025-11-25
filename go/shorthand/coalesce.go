package shorthand

import "reflect"

// Return the first non-zero value.
func Coalesce[T any](values ...T) T {
	for _, value := range values {
		reflectValue := reflect.ValueOf(value)

		if reflectValue.IsValid() && !reflectValue.IsZero() {
			return value
		}
	}

	return Zero[T]()
}

// Return the first non-zero value returned by a function.
func CoalesceFunc[T any](funcs ...func() T) T {
	for _, fn := range funcs {
		value := fn()
		reflectValue := reflect.ValueOf(value)

		if reflectValue.IsValid() && !reflectValue.IsZero() {
			return value
		}
	}

	return Zero[T]()
}

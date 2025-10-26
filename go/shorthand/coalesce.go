package shorthand

import "reflect"

func Coalesce[T any](values ...T) T {
	for _, value := range values {
		reflectValue := reflect.ValueOf(value)

		if reflectValue.IsValid() && !reflectValue.IsZero() {
			return value
		}
	}

	var zero T
	return zero
}

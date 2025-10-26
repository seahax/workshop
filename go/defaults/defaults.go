package defaults

import "reflect"

func NonZeroOrDefault[T any](value T, defaultValue T) T {
	reflectValue := reflect.ValueOf(value)

	if !reflectValue.IsValid() || reflectValue.IsZero() {
		return defaultValue
	}

	return value
}

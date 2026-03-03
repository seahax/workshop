package env

import (
	"fmt"
	"reflect"
)

// Bind environment variables to a tagged struct.
// Tag example: `env:"APP_ENVIRONMENT"`
func Bind[T any](value *T, options ...Option) error {
	opts := resolveOptions(options)
	structType := reflect.TypeFor[T]()
	structValue := reflect.ValueOf(value)

	for _, structField := range reflect.VisibleFields(structType) {
		key := structField.Tag.Get("env")

		if key == "" {
			continue
		}

		key = opts.Prefix + key
		in, ok := opts.Getter.Get(key)

		if !ok {
			// Leave the default value alone if env var is not set.
			continue
		}

		out := structValue.Elem().FieldByIndex(structField.Index)

		if err := opts.Parser.Parse(in, out); err != nil {
			return fmt.Errorf("Failed parsing environment %q: %w", key, err)
		}
	}

	if err := opts.Validator.Struct(value); err != nil {
		return err
	}

	return nil
}

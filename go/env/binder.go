package env

import (
	"fmt"
	"reflect"

	"seahax.com/go/shorthand"
)

const (
	tagEnv = "env"
)

type Binder[T any] struct {
	Prefix    string
	Getter    Getter
	Decoder   Decoder
	Validator Validator
}

// Create a new [Binder].
func NewBinder[T any]() Binder[T] {
	return Binder[T]{}
}

// Create a new [Binder] with prefix.
func NewBinderWithPrefix[T any](prefix string) Binder[T] {
	return Binder[T]{Prefix: prefix}
}

// Bind environment variables to a tagged struct.
// Tag example: `env:"APP_ENVIRONMENT"`
func (e Binder[T]) Bind() (*T, error) {
	value := new(T)
	err := e.BindTo(value)
	return value, err
}

// Bind environment variables to a tagged struct.
// Tag example: `env:"APP_ENVIRONMENT"`
func (e Binder[T]) BindTo(structPtr *T) error {
	structValue := reflect.ValueOf(structPtr).Elem()

	for _, structField := range reflect.VisibleFields(structValue.Type()) {
		if !structField.IsExported() {
			continue
		}

		key := structField.Tag.Get(tagEnv)

		if key == "" {
			continue
		}

		getter := shorthand.Coalesce(e.Getter, GetterDefault)
		key = e.Prefix + key
		value, ok := getter.Get(key)

		if !ok {
			// Leave the default value alone if env var is not set.
			continue
		}

		decoder := shorthand.Coalesce(e.Decoder, DecoderDefault)
		decoded, err := decoder.Decode(value, structField.Type)

		if err != nil {
			return fmt.Errorf("failed parsing environment %q: %w", key, err)
		}

		out := structValue.FieldByIndex(structField.Index)
		out.Set(reflect.ValueOf(decoded))
	}

	validator := shorthand.Coalesce(e.Validator, ValidatorDefault)

	if err := validator.Validate(structPtr); err != nil {
		return err
	}

	return nil
}

// Bind environment variables to a tagged struct.
func Bind[T any]() (*T, error) {
	return NewBinder[T]().Bind()
}

// Bind environment variables to a tagged struct.
func BindWithPrefix[T any](prefix string) (*T, error) {
	return NewBinderWithPrefix[T](prefix).Bind()
}

// Bind environment variables to a tagged struct instance.
func BindTo[T any](value *T) error {
	return NewBinder[T]().BindTo(value)
}

// Bind environment variables to a tagged struct instance.
func BindToWithPrefix[T any](prefix string, value *T) error {
	return NewBinderWithPrefix[T](prefix).BindTo(value)
}

package env

import (
	"errors"
	"reflect"
	"regexp"
	"strings"

	"seahax.com/go/shorthand"
)

type Binder struct {
	Env Env
	// Prefix to add to all environment variable names. The prefix will be
	// uppercased automatically. For example, a field with tag `env:"PORT"` and
	// prefix `app_` will bind to the environment variable `APP_PORT`.
	//
	// Default: ""
	Prefix string
	// Custom parsers for specific types.
	Parsers map[reflect.Type]parserFunc
	// If true, continue binding other fields even if one field fails to parse.
	// All errors will be collected and returned as a single [errors.Join] error.
	ContinueOnError bool
}

var rxInvalidNameChars = regexp.MustCompile("[^A-Z0-9_]+")

// Use the Binder to bind environment variables to the target struct. The
// returned error will be a *BindEnvError, or []*BindEnvError if
// Binder.ContinueOnError is true. Will panic if the target is not a struct
// pointer.
func (b *Binder) Bind(target any) error {
	reflectStruct := reflectStruct(target)
	reflectStructType := reflectStruct.Type()

	var errs []error

	for i := 0; i < reflectStruct.NumField(); i++ {
		reflectField := reflectStructType.Field(i)

		if !reflectField.IsExported() {
			continue
		}

		tagValue, ok := reflectField.Tag.Lookup("env")

		if !ok {
			continue
		}

		envName := normalizeEnvName(b.Prefix, tagValue)
		env := shorthand.Coalesce(b.Env, defaultEnv)
		envStr, envExists := env.LookupEnv(envName)

		if !envExists {
			// If the environment variable is not set, leave the field value alone to
			// use the pre-initialized value as the default.
			continue
		}

		parser := shorthand.CoalesceFunc(
			func() parserFunc { return getCustomParser(reflectField.Type, b.Parsers) },
			func() parserFunc { return getDefaultParser(reflectField.Type) },
		)

		value, err := parser(envStr, envName, reflectField)

		if err != nil {
			err := &BindEnvError{error: err, EnvName: envName, FieldName: reflectField.Name}

			if b.ContinueOnError {
				errs = append(errs, err)
				continue
			}

			return err
		}

		reflectValue := reflect.ValueOf(value).Convert(reflectStruct.Field(i).Type())
		reflectStruct.Field(i).Set(reflectValue)
	}

	if len(errs) > 0 {
		return errors.Join(errs...)
	}

	return nil
}

// Get the environment variable name for the given struct field, including the
// Binder.Prefix. If the field does not have an `env` tag, an empty string is
// returned.
func (b *Binder) GetEnvName(target any, fieldName string) string {
	reflectStruct := reflectStruct(target)

	field, ok := reflectStruct.Type().FieldByName(fieldName)

	if !ok {
		return ""
	}

	envName, ok := field.Tag.Lookup("env")

	if !ok {
		return ""
	}

	return normalizeEnvName(b.Prefix, envName)
}

var binder = Binder{}

// Use the Binder to bind environment variables to the target struct. The
// returned error will be a *BindEnvError, or []*BindEnvError if
// Binder.ContinueOnError is true. Will panic if the target is not a struct
// pointer.
func Bind(target any) error {
	return binder.Bind(target)
}

// Get the environment variable name for the given struct field. If the field
// does not have an `env` tag, an empty string is returned.
//
// Note: If you are using a binder with a Prefix, use the binder's GetEnvName
// method instead so that the prefix is included.
func GetEnvName(target any, fieldName string) string {
	return binder.GetEnvName(target, fieldName)
}

func reflectStruct(target any) reflect.Value {
	value := reflect.ValueOf(target)

	if value.Kind() != reflect.Pointer {
		panic("only struct pointers can be bound to the environment")
	}

	value = value.Elem()

	if value.Kind() != reflect.Struct {
		panic("only struct pointers can be bound to the environment")
	}

	return value
}

func normalizeEnvName(prefix string, envName string) string {
	value := strings.TrimSpace(prefix) + strings.TrimSpace(envName)
	value = strings.ToUpper(value)
	value = rxInvalidNameChars.ReplaceAllString(value, "_")

	return value
}

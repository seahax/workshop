package env

import (
	"errors"
	"fmt"
	"reflect"
	"regexp"
	"strings"

	"seahax.com/go/shorthand"
)

type Binder struct {
	env Env
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
	prefix := strings.ToUpper(b.Prefix)
	reflectRoot := reflect.ValueOf(target)

	if reflectRoot.Kind() == reflect.Pointer {
		reflectRoot = reflectRoot.Elem()
	}

	if reflectRoot.Kind() != reflect.Struct {
		panic(fmt.Errorf("only struct pointers can be bound to the environment"))
	}

	reflectRootType := reflectRoot.Type()
	var errs []error

	for i := 0; i < reflectRoot.NumField(); i++ {
		reflectField := reflectRootType.Field(i)

		if !reflectField.IsExported() {
			continue
		}

		envName, ok := reflectField.Tag.Lookup("env")
		envName = strings.TrimSpace(envName)

		if !ok || envName == "" {
			continue
		}

		envName = prefix + envName
		envName = strings.ToUpper(envName)
		envName = rxInvalidNameChars.ReplaceAllString(envName, "_")
		env := shorthand.Coalesce(b.env, defaultEnv)
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

		reflectValue := reflect.ValueOf(value).Convert(reflectRoot.Field(i).Type())
		reflectRoot.Field(i).Set(reflectValue)
	}

	if len(errs) > 0 {
		return errors.Join(errs...)
	}

	return nil
}

// Bind environment variables to the target struct. If any variable fails to
// bind, a *BindEnvError will be returned. Will panic if the target is not a
// struct pointer.
func Bind(target any) error {
	binder := Binder{}
	return binder.Bind(target)
}

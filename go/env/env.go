package env

import (
	"errors"
	"fmt"
	"os"
	"reflect"
	"regexp"
	"strconv"
	"strings"

	"github.com/go-playground/validator/v10"
)

var rxAddUnderscore = regexp.MustCompile("([^A-Z])([A-Z])")
var validate = validator.New()

// Bind environment variables with the given prefix to the target struct, with
// validation (go-playground/validator).
func BindPrefixedEnv(prefix string, target any) error {
	reflectRoot := reflect.ValueOf(target)

	if reflectRoot.Kind() == reflect.Pointer {
		reflectRoot = reflectRoot.Elem()
	}

	if reflectRoot.Kind() != reflect.Struct {
		panic(fmt.Errorf("only struct pointers can be bound to the environment"))
	}

	reflectRootType := reflectRoot.Type()

	for i := 0; i < reflectRoot.NumField(); i++ {
		reflectField := reflectRootType.Field(i)

		if !reflectField.IsExported() {
			continue
		}

		envTag := reflectField.Tag.Get("env")

		if envTag == "ignore" {
			continue
		}

		fieldName := reflectField.Name
		envName := prefix + strings.ToUpper(rxAddUnderscore.ReplaceAllString(fieldName, "${1}_${2}"))
		envStr, envExists := os.LookupEnv(envName)

		var value any

		if envExists {
			var parse func() (any, error)

			switch reflectField.Type.Kind() {
			case reflect.String:
				parse = func() (any, error) { return envStr, nil }
			case reflect.Int64:
				parse = func() (any, error) { return strconv.ParseInt(envStr, 10, 64) }
			case reflect.Int32:
				parse = func() (any, error) { return strconv.ParseInt(envStr, 10, 32) }
			case reflect.Int16:
				parse = func() (any, error) { return strconv.ParseInt(envStr, 10, 16) }
			case reflect.Int8:
				parse = func() (any, error) { return strconv.ParseInt(envStr, 10, 8) }
			case reflect.Int:
				parse = func() (any, error) { return strconv.ParseInt(envStr, 10, 0) }
			case reflect.Uint64:
				parse = func() (any, error) { return strconv.ParseUint(envStr, 10, 64) }
			case reflect.Uint32:
				parse = func() (any, error) { return strconv.ParseUint(envStr, 10, 32) }
			case reflect.Uint16:
				parse = func() (any, error) { return strconv.ParseUint(envStr, 10, 16) }
			case reflect.Uint8:
				parse = func() (any, error) { return strconv.ParseUint(envStr, 10, 8) }
			case reflect.Uint:
				parse = func() (any, error) { return strconv.ParseUint(envStr, 10, 0) }
			case reflect.Float64:
				parse = func() (any, error) { return strconv.ParseFloat(envStr, 64) }
			case reflect.Float32:
				parse = func() (any, error) { return strconv.ParseFloat(envStr, 32) }
			case reflect.Bool:
				parse = func() (any, error) { return strconv.ParseBool(envStr) }
			default:
				panic(fmt.Errorf(
					"unsupported field type %s for %s",
					reflectField.Type.Kind(),
					envName,
				))
			}

			parsedValue, err := parse()

			if err != nil {
				return fmt.Errorf(
					`failed parsing environment "%s" as %s: %w`,
					envName,
					reflectField.Type.Kind(),
					err,
				)
			}

			value = parsedValue
		} else {
			value = reflectRoot.Field(i).Interface()
		}

		validateTag := reflectField.Tag.Get("validate")

		if validateTag != "" {
			err := func() error {
				defer func() {
					if r := recover(); r != nil {
						panic(fmt.Sprintf("failed validating environment %s (validate: %s) (%v)", envName, validateTag, r))
					}
				}()

				return validate.Var(value, validateTag)
			}()

			var fieldErr validator.FieldError

			if errors.As(err, &fieldErr) {
				return fmt.Errorf(`environment %s is invalid (%s)`, envName, fieldErr.Tag())
			} else if err != nil {
				return fmt.Errorf(`environment %s is invalid (%s)`, envName, validateTag)
			}
		}

		reflectValue := reflect.ValueOf(value).Convert(reflectRoot.Field(i).Type())
		reflectRoot.Field(i).Set(reflectValue)
	}

	return nil
}

// Bind environment variables to the target struct, with validation
// (go-playground/validator).
func BindEnv(target any) error {
	return BindPrefixedEnv("", target)
}

package env

import (
	"fmt"
	"log"
	"os"
	"reflect"
	"regexp"
	"strconv"
	"strings"
)

var rxInvalidNameChars = regexp.MustCompile("[^A-Z0-9_]+")

// Bind environment variables with the given prefix to the target struct, with
// validation (go-playground/validator).
func BindWithPrefix(prefix string, target any) error {
	prefix = strings.ToUpper(prefix)
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

		envName, ok := reflectField.Tag.Lookup("env")

		if !ok || envName == "" {
			continue
		}

		envName = strings.TrimSpace(envName)
		envName = strings.ToUpper(envName)
		envName = rxInvalidNameChars.ReplaceAllString(envName, "_")
		envName = prefix + envName
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

		reflectValue := reflect.ValueOf(value).Convert(reflectRoot.Field(i).Type())
		reflectRoot.Field(i).Set(reflectValue)
	}

	return nil
}

// Bind environment variables to the target struct, with validation
// (go-playground/validator).
func Bind(target any) error {
	return BindWithPrefix("", target)
}

// Helper for getting the env tag value of a struct field. If the field or tag
// is not found, an empty string is returned.
func GetTag(target any, name string) string {
	value := reflect.ValueOf(target)

	if value.Kind() != reflect.Pointer {
		log.Panicln("environment binding only supports struct pointers")
	}

	value = value.Elem()

	if value.Kind() != reflect.Struct {
		log.Panicln("environment binding only supports struct pointers")
	}

	field, ok := value.Type().FieldByName(name)

	if !ok {
		return ""
	}

	env, ok := field.Tag.Lookup("env")

	if !ok {
		return ""
	}

	return env
}

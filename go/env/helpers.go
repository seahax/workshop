package env

import (
	"log"
	"reflect"
)

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

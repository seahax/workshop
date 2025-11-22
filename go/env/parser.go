package env

import (
	"encoding"
	"encoding/json"
	"fmt"
	"reflect"
	"strconv"
)

func parse[T any](str string, parser func(reflect.Type) func(string) (any, error)) (T, error) {
	pointerType, isPointer := getPointerType[T]()
	elemType := pointerType.Elem()
	parse := parser(elemType)

	if parse == nil {
		if pointerType.AssignableTo(reflect.TypeFor[encoding.TextUnmarshaler]()) {
			parse = getTextParser(elemType)
		} else if pointerType.AssignableTo(reflect.TypeFor[json.Unmarshaler]()) {
			parse = getJsonParser(elemType)
		} else {
			parse = getTypeParser(elemType)
		}
	}

	value, err := parse(str)

	if err != nil {
		var zero T
		return zero, err
	}

	if isPointer {
		value = &value
	}

	return reflect.ValueOf(value).Convert(reflect.TypeFor[T]()).Interface().(T), nil
}

func getTextParser(elemType reflect.Type) func(string) (any, error) {
	return func(str string) (any, error) {
		pointer := reflect.New(elemType).Interface()

		if err := pointer.(encoding.TextUnmarshaler).UnmarshalText([]byte(str)); err != nil {
			return nil, err
		}

		return reflect.ValueOf(pointer).Elem().Interface(), nil
	}
}

func getJsonParser(elemType reflect.Type) func(string) (any, error) {
	return func(str string) (any, error) {
		pointer := reflect.New(elemType).Interface()

		if err := json.Unmarshal([]byte(str), pointer); err != nil {
			return nil, err
		}

		return reflect.ValueOf(pointer).Elem().Interface(), nil
	}
}

func getTypeParser(elemType reflect.Type) func(string) (any, error) {
	switch elemType.Kind() {
	case reflect.String:
		return func(str string) (any, error) { return str, nil }
	case reflect.Int64:
		return func(str string) (any, error) {
			return strconv.ParseInt(str, 10, 64)
		}
	case reflect.Int32:
		return func(str string) (any, error) {
			return strconv.ParseInt(str, 10, 32)
		}
	case reflect.Int16:
		return func(str string) (any, error) {
			return strconv.ParseInt(str, 10, 16)
		}
	case reflect.Int8:
		return func(str string) (any, error) {
			return strconv.ParseInt(str, 10, 8)
		}
	case reflect.Int:
		return func(str string) (any, error) {
			return strconv.ParseInt(str, 10, 0)
		}
	case reflect.Uint64:
		return func(str string) (any, error) {
			return strconv.ParseUint(str, 10, 64)
		}
	case reflect.Uint32:
		return func(str string) (any, error) {
			return strconv.ParseUint(str, 10, 32)
		}
	case reflect.Uint16:
		return func(str string) (any, error) {
			return strconv.ParseUint(str, 10, 16)
		}
	case reflect.Uint8:
		return func(str string) (any, error) {
			return strconv.ParseUint(str, 10, 8)
		}
	case reflect.Uint:
		return func(str string) (any, error) {
			return strconv.ParseUint(str, 10, 0)
		}
	case reflect.Float64:
		return func(str string) (any, error) {
			return strconv.ParseFloat(str, 64)
		}
	case reflect.Float32:
		return func(str string) (any, error) {
			return strconv.ParseFloat(str, 32)
		}
	case reflect.Bool:
		return func(str string) (any, error) {
			return strconv.ParseBool(str)
		}
	}

	panic(fmt.Sprintf("unsupported type %s", elemType))
}

func getPointerType[T any]() (pointerType reflect.Type, isPointer bool) {
	t := reflect.TypeFor[T]()

	if t.Kind() == reflect.Pointer {
		return t, true
	}

	return reflect.PointerTo(t), false
}

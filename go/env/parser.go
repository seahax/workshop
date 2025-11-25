package env

import (
	"encoding"
	"encoding/json"
	"errors"
	"reflect"
	"slices"
	"strconv"

	"seahax.com/go/shorthand"
)

// Error returned by a parser to indicate that it does not support a type.
var ErrUnsupportedType = errors.New("type not supported by parser")

func parse[T any](str string, parsers []func(reflect.Type, string) (any, error)) (T, error) {
	elemType, isPointer := getElementType[T]()
	parsers = append(slices.Clone(parsers),
		parseTextUnmarshaler,
		parseJsonUnmarshaler,
		parseDefault,
	)

	for _, parser := range parsers {
		value, err := parser(elemType, str)

		if err == nil {
			if isPointer {
				value = &value
			}

			result := reflect.ValueOf(value).Convert(reflect.TypeFor[T]()).Interface().(T)

			return shorthand.Ok(result)
		}

		if !errors.Is(err, ErrUnsupportedType) {
			return shorthand.Fail[T](err)
		}
	}

	return shorthand.Fail[T](ErrUnsupportedType)
}

func parseTextUnmarshaler(elemType reflect.Type, str string) (any, error) {
	pointer, ok := reflect.New(elemType).Interface().(encoding.TextUnmarshaler)

	if !ok {
		return nil, ErrUnsupportedType
	}

	if err := pointer.UnmarshalText([]byte(str)); err != nil {
		return nil, err
	}

	return reflect.ValueOf(pointer).Elem().Interface(), nil
}

func parseJsonUnmarshaler(elemType reflect.Type, str string) (any, error) {
	pointer, ok := reflect.New(elemType).Interface().(json.Unmarshaler)

	if !ok {
		return nil, ErrUnsupportedType
	}

	if err := pointer.UnmarshalJSON([]byte(str)); err != nil {
		return nil, err
	}

	return reflect.ValueOf(pointer).Elem().Interface(), nil
}

func parseDefault(elemType reflect.Type, str string) (any, error) {
	switch elemType.Kind() {
	case reflect.String:
		return str, nil
	case reflect.Int64:
		return strconv.ParseInt(str, 10, 64)
	case reflect.Int32:
		return strconv.ParseInt(str, 10, 32)
	case reflect.Int16:
		return strconv.ParseInt(str, 10, 16)
	case reflect.Int8:
		return strconv.ParseInt(str, 10, 8)
	case reflect.Int:
		return strconv.ParseInt(str, 10, 0)
	case reflect.Uint64:
		return strconv.ParseUint(str, 10, 64)
	case reflect.Uint32:
		return strconv.ParseUint(str, 10, 32)
	case reflect.Uint16:
		return strconv.ParseUint(str, 10, 16)
	case reflect.Uint8:
		return strconv.ParseUint(str, 10, 8)
	case reflect.Uint:
		return strconv.ParseUint(str, 10, 0)
	case reflect.Float64:
		return strconv.ParseFloat(str, 64)
	case reflect.Float32:
		return strconv.ParseFloat(str, 32)
	case reflect.Bool:
		return strconv.ParseBool(str)
	}

	return nil, ErrUnsupportedType
}

func getElementType[T any]() (elemType reflect.Type, isPointer bool) {
	t := reflect.TypeFor[T]()

	if t.Kind() == reflect.Pointer {
		return t.Elem(), true
	}

	return t, false
}

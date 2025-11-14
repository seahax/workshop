package env

import (
	"encoding"
	"encoding/json"
	"fmt"
	"reflect"
	"strconv"
)

type ParserFunc func(envStr string, envName string, reflectField reflect.StructField) (any, error)

func getCustomParser(type_ reflect.Type, parsers map[reflect.Type]ParserFunc) ParserFunc {
	if parsers == nil {
		return nil
	}

	return parsers[type_]
}

func getDefaultParser(type_ reflect.Type) ParserFunc {
	pointerType := getPointer(type_)

	if pointerType.AssignableTo(reflect.TypeFor[encoding.TextUnmarshaler]()) {
		return func(envStr string, envName string, reflectField reflect.StructField) (any, error) {
			pointer := reflect.New(pointerType.Elem()).Interface()

			if err := pointer.(encoding.TextUnmarshaler).UnmarshalText([]byte(envStr)); err != nil {
				return nil, err
			}

			return reflect.ValueOf(pointer).Elem().Interface(), nil
		}
	}

	if pointerType.AssignableTo(reflect.TypeFor[json.Unmarshaler]()) {
		return func(envStr string, envName string, reflectField reflect.StructField) (any, error) {
			pointer := reflect.New(pointerType.Elem()).Interface()

			if err := json.Unmarshal([]byte(strconv.Quote(envStr)), pointer); err != nil {
				return nil, err
			}

			return reflect.ValueOf(pointer).Elem().Interface(), nil
		}
	}

	switch type_.Kind() {
	case reflect.String:
		return func(envStr string, envName string, reflectField reflect.StructField) (any, error) { return envStr, nil }
	case reflect.Int64:
		return func(envStr string, envName string, reflectField reflect.StructField) (any, error) {
			return strconv.ParseInt(envStr, 10, 64)
		}
	case reflect.Int32:
		return func(envStr string, envName string, reflectField reflect.StructField) (any, error) {
			return strconv.ParseInt(envStr, 10, 32)
		}
	case reflect.Int16:
		return func(envStr string, envName string, reflectField reflect.StructField) (any, error) {
			return strconv.ParseInt(envStr, 10, 16)
		}
	case reflect.Int8:
		return func(envStr string, envName string, reflectField reflect.StructField) (any, error) {
			return strconv.ParseInt(envStr, 10, 8)
		}
	case reflect.Int:
		return func(envStr string, envName string, reflectField reflect.StructField) (any, error) {
			return strconv.ParseInt(envStr, 10, 0)
		}
	case reflect.Uint64:
		return func(envStr string, envName string, reflectField reflect.StructField) (any, error) {
			return strconv.ParseUint(envStr, 10, 64)
		}
	case reflect.Uint32:
		return func(envStr string, envName string, reflectField reflect.StructField) (any, error) {
			return strconv.ParseUint(envStr, 10, 32)
		}
	case reflect.Uint16:
		return func(envStr string, envName string, reflectField reflect.StructField) (any, error) {
			return strconv.ParseUint(envStr, 10, 16)
		}
	case reflect.Uint8:
		return func(envStr string, envName string, reflectField reflect.StructField) (any, error) {
			return strconv.ParseUint(envStr, 10, 8)
		}
	case reflect.Uint:
		return func(envStr string, envName string, reflectField reflect.StructField) (any, error) {
			return strconv.ParseUint(envStr, 10, 0)
		}
	case reflect.Float64:
		return func(envStr string, envName string, reflectField reflect.StructField) (any, error) {
			return strconv.ParseFloat(envStr, 64)
		}
	case reflect.Float32:
		return func(envStr string, envName string, reflectField reflect.StructField) (any, error) {
			return strconv.ParseFloat(envStr, 32)
		}
	case reflect.Bool:
		return func(envStr string, envName string, reflectField reflect.StructField) (any, error) {
			return strconv.ParseBool(envStr)
		}
	}

	return func(envStr string, envName string, reflectField reflect.StructField) (any, error) {
		panic(fmt.Sprintf(
			"unsupported field type %s for %s",
			reflectField.Type.Kind(),
			envName,
		))
	}
}

func getPointer(type_ reflect.Type) reflect.Type {
	if type_.Kind() == reflect.Pointer {
		return type_
	}

	return reflect.PointerTo(type_)
}

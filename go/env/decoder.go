package env

import (
	"reflect"
)

type Decoder interface {
	Decode(value string, targetType reflect.Type) (decodedValue any, err error)
}

// Convert a string to a value of the given type.
type Decode func(value string, targetType reflect.Type) (decodedValue any, err error)

func (d Decode) Decode(value string, targetType reflect.Type) (decodedValue any, err error) {
	return d(value, targetType)
}

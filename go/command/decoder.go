package command

import (
	"reflect"
)

// Convert a string to a value of the given type.
type Decoder interface {
	// Convert a string to a value of the given type.
	Decode(value string, targetType reflect.Type) (decodedValue any, err error)
}

// Convert a string to a value of the given type.
type Decode func(value string, targetType reflect.Type) (decodedValue any, err error)

func (d Decode) Decode(value string, targetType reflect.Type) (decodedValue any, err error) {
	return d(value, targetType)
}

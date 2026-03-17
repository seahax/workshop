package env

import (
	"reflect"

	"seahax.com/go/shorthand"
)

var DecoderDefault Decoder = Decode(func(value string, targetType reflect.Type) (any, error) {
	return shorthand.Decode(value, targetType)
})

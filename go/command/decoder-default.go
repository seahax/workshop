package command

import (
	"reflect"

	"seahax.com/go/shorthand"
)

// Default decoder.
var DecoderDefault Decoder = Decode(func(value string, targetType reflect.Type) (any, error) {
	return shorthand.Decode(value, targetType)
})

package shorthand

import (
	"encoding"
	"fmt"
	"reflect"
)

// Convert a string to a value of the given type.
//
// Uses [encoding.TextUnmarshaler] for values that implement it, or else
// [fmt.Sscan].
func Decode(in string, typ reflect.Type) (any, error) {
	isPtr := typ.Kind() == reflect.Pointer

	var ptr reflect.Value

	if isPtr {
		ptr = reflect.Zero(typ)
	} else {
		ptr = reflect.New(typ)
	}

	if unmarshaler, ok := reflect.TypeAssert[encoding.TextUnmarshaler](ptr); ok {
		err := unmarshaler.UnmarshalText([]byte(in))
		return ptr.Elem().Interface(), err
	}

	if reflect.TypeFor[string]().AssignableTo(typ) {
		// No decoding required. The input string is assignable to the type.
		return in, nil
	}

	if _, err := fmt.Sscan(in, ptr.Interface()); err != nil {
		return ptr.Elem().Interface(), fmt.Errorf("failed decoding %s from %q", typ, in)
	}

	if isPtr {
		return ptr.Interface(), nil
	} else {
		return ptr.Elem().Interface(), nil
	}
}

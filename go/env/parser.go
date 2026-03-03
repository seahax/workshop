package env

import (
	"encoding"
	"fmt"
	"reflect"
)

// Environment variable parser.
type Parser interface {
	// Parse the input string and set the output value.
	Parse(in string, out reflect.Value) error
}

// Function that implements the [Parser] type.
type ParserFn func(in string, out reflect.Value) error

func (p ParserFn) Parse(in string, out reflect.Value) error {
	return p(in, out)
}

// Parser that uses [encoding.TextUnmarshaler] for values that implement it, or
// [fmt.Sscan] to handle arbitrary string to type parsing.
var DefaultParser ParserFn = func(in string, out reflect.Value) error {
	if unmarshaler, ok := out.Addr().Interface().(encoding.TextUnmarshaler); ok {
		if err := unmarshaler.UnmarshalText([]byte(in)); err != nil {
			return err
		}
	} else if reflect.TypeFor[string]().AssignableTo(out.Type()) {
		out.Set(reflect.ValueOf(in))
	} else if _, err := fmt.Sscan(in, out.Addr().Interface()); err != nil {
		return fmt.Errorf("Failed decoding %s from %q", out.Type(), in)
	}

	return nil
}

package command

import (
	"flag"
	"fmt"
	"reflect"
)

// Parse command line arguments defined by struct field tags.
type Parser struct {
	StructType reflect.Type
	Decoder    Decoder
}

// Create a new [Parser].
func NewParser(structType reflect.Type, decoder Decoder) Parser {
	return Parser{StructType: structType, Decoder: decoder}
}

// Parse the command line arguments and return a new instance of the parser
// type with the parsed values.
func (p Parser) Parse(args []string) (parsedPtr any, err error) {
	target := reflect.New(p.StructType)
	args, positionalFields, err := p.parseNamed(target, args)

	if err != nil {
		return nil, err
	}

	if err := p.parsePositional(target, args, positionalFields); err != nil {
		return nil, err
	}

	return target.Interface(), nil
}

func (p Parser) parseNamed(target reflect.Value, args []string) ([]string, []Field, error) {
	positionalFields := []Field{}
	flagSet := flag.NewFlagSet("-", flag.ContinueOnError)
	flagSet.Usage = func() {}
	flagSet.SetOutput(&parseFlagSetWriter{})

	for field := range FieldIterator(p.StructType) {
		if !field.IsNamedFlag() {
			positionalFields = append(positionalFields, field)
			continue
		}

		hasName := false

		for name := range field.FlagNames() {
			hasName = true

			if field.DecodeType() == reflect.TypeFor[bool]() {
				flagSet.BoolFunc(name, "", func(s string) error {
					return p.set(target, field, s)
				})
			} else {
				flagSet.Func(name, "", func(s string) error {
					return p.set(target, field, s)
				})
			}
		}

		if !hasName {
			panic(fmt.Sprintf("no valid flag names found in %q", field.Flag()))
		}
	}

	if err := flagSet.Parse(args); err != nil {
		return nil, nil, err
	}

	return flagSet.Args(), positionalFields, nil
}

func (p Parser) parsePositional(target reflect.Value, args []string, fields []Field) error {
	var last *Field

	for _, field := range fields {
		if len(args) == 0 {
			break
		}

		arg := args[0]
		args = args[1:]

		if err := p.set(target, field, arg); err != nil {
			return fmt.Errorf("invalid argument %q for %s: %w", arg, field.Flag(), err)
		}

		last = &field
	}

	if len(args) == 0 {
		return nil
	}

	if last == nil || !last.IsSlice() {
		return fmt.Errorf("too many arguments")
	}

	for _, arg := range args {
		if err := p.set(target, *last, arg); err != nil {
			return fmt.Errorf("invalid argument %q for %s: %w", arg, last.Flag(), err)
		}
	}

	return nil
}

func (p Parser) set(target reflect.Value, field Field, value string) error {
	decoded, err := p.Decoder.Decode(value, field.DecodeType())

	if err != nil {
		return err
	}

	field.Set(target, decoded)

	return nil
}

type parseFlagSetWriter struct{}

func (w *parseFlagSetWriter) Write(b []byte) (int, error) {
	return len(b), nil
}

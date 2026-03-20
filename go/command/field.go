package command

import (
	"fmt"
	"iter"
	"reflect"
	"regexp"
	"strings"
)

const (
	tagFlag string = "flag"
	tagHelp string = "help"
)

var fieldFlagSplit = regexp.MustCompile(`[ ,|]`)
var fieldFlagMatch = regexp.MustCompile(`-+([a-zA-Z0-9]+(?:-+[a-zA-Z0-9]+)*)`)

// Field represents a struct field tagged with the "flag" tag.
type Field struct {
	structField   reflect.StructField
	structPtrType reflect.Type
}

// Create a new [Field].
func NewField(structPtrType reflect.Type, field reflect.StructField) Field {
	return Field{structField: field, structPtrType: structPtrType}
}

// Get the flag usage (the value of the "flag" tag).
func (f Field) Flag() string {
	return f.structField.Tag.Get(tagFlag)
}

// True if the flag usage ([Field.Flag]) starts with a hyphen, indicating a
// named flag.
func (f Field) IsNamedFlag() bool {
	return strings.HasPrefix(f.Flag(), "-")
}

// Parse named flag ([Field.IsNamedFlag]) names from the flag usage
// ([Field.Flag]).
func (f Field) FlagNames() iter.Seq[string] {
	return func(yield func(string) bool) {
		if !f.IsNamedFlag() {
			return
		}

		for _, part := range fieldFlagSplit.Split(f.Flag(), -1) {
			match := fieldFlagMatch.FindStringSubmatch(part)

			if match != nil {
				if !yield(match[1]) {
					return
				}
			}
		}
	}
}

// Get the flag help text (the value of the "help" tag).
func (f Field) Help() string {
	return f.structField.Tag.Get(tagHelp)
}

// Get the element type of the struct field. If the struct field is a slice,
// return the slice element type. This is the type used to decode individual
// values.
func (f Field) DecodeType() reflect.Type {
	if f.IsSlice() {
		return f.structField.Type.Elem()
	}

	return f.structField.Type
}

// True if the struct field is a slice.
func (f Field) IsSlice() bool {
	return f.structField.Type.Kind() == reflect.Slice
}

// Set the value of the target struct field. If the struct field is a slice,
// append the value to the slice.
func (f Field) Set(target reflect.Value, value any) {
	if f.structPtrType != target.Type().Elem() {
		panic(fmt.Sprintf("field struct type %s does not match target type %s", f.structPtrType, target.Type().Elem()))
	}

	field := target.Elem().FieldByIndex(f.structField.Index)

	if f.IsSlice() {
		field.Set(reflect.Append(field, reflect.ValueOf(value)))
	} else {
		field.Set(reflect.ValueOf(value))
	}
}

package command

import (
	"iter"
	"reflect"
)

// Return a new Seq that yields each visable and exported struct field that is
// tagged with the "flag" tag.
func FieldIterator(structType reflect.Type) iter.Seq[Field] {
	return func(yield func(Field) bool) {
		for _, structField := range reflect.VisibleFields(structType) {
			if !structField.IsExported() {
				continue
			}

			field := NewField(structType, structField)

			if field.Flag() == "" {
				continue
			}

			if !yield(field) {
				return
			}
		}
	}
}

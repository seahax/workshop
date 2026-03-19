package command

import (
	"reflect"

	"github.com/go-playground/validator/v10"
	"seahax.com/go/shorthand"
)

var PlaygroundValidate = validator.New(validator.WithRequiredStructEnabled())

func init() {
	PlaygroundValidate.RegisterTagNameFunc(func(field reflect.StructField) string {
		return shorthand.Coalesce(field.Tag.Get(tagFlag), field.Name)
	})
}

// Validator based on [github.com/go-playground/validator/v10]. Validation
// configuration can be applied to the [PlaygroundValidate] singleton instance
// that is used by this function.
var PlaygroundValidator Validator = Validate(func(value any) error {
	if err := PlaygroundValidate.Struct(value); err != nil {
		return PlaygroundValidationErrors(err.(validator.ValidationErrors))
	}

	return nil
})

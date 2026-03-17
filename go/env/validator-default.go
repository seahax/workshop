package env

import (
	"errors"
	"fmt"
	"reflect"

	"github.com/go-playground/validator/v10"
	"seahax.com/go/shorthand"
)

// Default validation function. Uses [github.com/go-playground/validator/v10]
// to validate the opts struct based on "validate" tags.
var ValidatorDefault Validator = Validate(func(value any) error {
	validate := validator.New(validator.WithRequiredStructEnabled())
	validate.RegisterTagNameFunc(func(field reflect.StructField) string {
		return shorthand.Coalesce(field.Tag.Get(tagEnv), field.Name)
	})

	err := validate.Struct(value)

	if err == nil {
		return nil
	}

	errs := []error{}

	for _, fieldError := range err.(validator.ValidationErrors) {
		errs = append(errs, fmt.Errorf("value of %q does not satisfy %q",
			fieldError.Field(),
			fieldError.Tag(),
		))
	}

	return errors.Join(errs...)
})

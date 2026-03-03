package env

import (
	"errors"
	"fmt"
	"reflect"

	"github.com/go-playground/validator/v10"
)

// Environment variable validator.
type Validator interface {
	// Validate the struct value.
	Struct(value any) error
}

// Function that implements the [Validator] type.
type ValidatorFn func(value any) error

func (v ValidatorFn) Struct(value any) error {
	return v(value)
}

// Validator that uses [github.com/go-playground/validator/v10].
var PlaygroundValidator ValidatorFn = func(value any) error {
	validate := validator.New(validator.WithRequiredStructEnabled())
	validate.RegisterTagNameFunc(func(structField reflect.StructField) string {
		return structField.Tag.Get("env")
	})

	if err := validate.Struct(value); err != nil {
		return NewPlaygroundValidatorError(err.(validator.ValidationErrors))
	}

	return nil
}

func NewPlaygroundValidatorError(fieldErrors validator.ValidationErrors) error {
	errs := []error{}

	for _, fieldError := range fieldErrors {
		errs = append(errs, fmt.Errorf("Invalid environment %q (%s)",
			fieldError.Field(),
			fieldError.ActualTag(),
		))
	}

	if len(errs) == 1 {
		return errs[0]
	}

	return errors.Join(errs...)
}

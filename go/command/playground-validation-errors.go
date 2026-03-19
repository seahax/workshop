package command

import (
	"errors"
	"fmt"

	"github.com/go-playground/validator/v10"
)

type PlaygroundValidationErrors validator.ValidationErrors

func (e PlaygroundValidationErrors) Error() string {
	return errors.Join(e.Unwrap()...).Error()
}

func (e PlaygroundValidationErrors) Unwrap() []error {
	errs := []error{}

	for _, fieldError := range e {
		errs = append(errs, fmt.Errorf("value of %q does not satisfy %q",
			fieldError.Field(),
			fieldError.Tag(),
		))
	}

	return errs
}

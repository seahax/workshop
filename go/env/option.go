package env

import (
	"errors"
	"fmt"
	"os"
	"reflect"
	"strings"

	"github.com/go-playground/validator/v10"
)

var defaultLookup = os.LookupEnv
var defaultValidate = validator.New()

type Option struct {
	Prefix   string
	Lookup   func(key string) (string, bool)
	Parser   func(type_ reflect.Type, value string) (any, error)
	Validate func(key string, value any) error
}

// Returns an option that adds a prefix when looking up environment variables.
func OptionPrefix(prefix string) Option {
	return Option{
		Prefix: prefix,
	}
}

// Returns an option that sets a custom lookup function for environment
// variables. Defaults to os.LookupEnv.
func OptionLookup(lookup func(string) (string, bool)) Option {
	return Option{
		Lookup: lookup,
	}
}

// Returns an option that sets a custom parser for environment variables.
// Parsers should return ErrUnsupportedType if they do not support the given
// type.
func OptionParser(parser func(type_ reflect.Type, value string) (any, error)) Option {
	return Option{
		Parser: parser,
	}
}

// Returns an option that applies go-playground/validator validation tags to
// environment variables.
func OptionValidate(tags ...string) Option {
	return OptionValidateFunc(func(key string, value any) error {
		err := defaultValidate.VarWithKey(key, value, strings.Join(tags, ","))

		var validationErrs validator.ValidationErrors

		if errors.As(err, &validationErrs) {
			errs := []error{}

			for _, err := range validationErrs {
				tag := err.ActualTag()

				if param := err.Param(); param != "" {
					tag += "=" + param
				}

				errs = append(errs, fmt.Errorf("config %q does not satisify %q", err.StructField(), tag))
			}

			return errors.Join(errs...)
		}

		return nil
	})
}

// Returns an option that sets a custom validation function for environment
// variables.
func OptionValidateFunc(validate func(key string, value any) error) Option {
	return Option{
		Validate: validate,
	}
}

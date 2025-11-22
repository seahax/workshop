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
	Parser   func(reflect.Type) func(value string) (any, error)
	Validate func(key string, value any) error
}

func OptionPrefix(prefix string) Option {
	return Option{
		Prefix: prefix,
	}
}

func OptionLookup(lookup func(string) (string, bool)) Option {
	return Option{
		Lookup: lookup,
	}
}

func OptionParser(parser func(reflect.Type) func(value string) (any, error)) Option {
	return Option{
		Parser: parser,
	}
}

func OptionValidate(tags ...string) Option {
	return Option{
		Validate: func(key string, value any) error {
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
		},
	}
}

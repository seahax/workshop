package env

import (
	"errors"
	"reflect"
)

// An environment binding option.
type Option struct {
	Prefix    string
	Getter    Getter
	Parser    Parser
	Validator Validator
}

// Returns an option that adds a prefix when looking up environment variables.
func OptionPrefix(prefix string) Option {
	return Option{
		Prefix: prefix,
	}
}

// Returns an option that adds a custom getter for environment variables.
func OptionGetter(getter Getter) Option {
	return Option{Getter: getter}
}

// Returns an option that adds a custom parser for environment variables.
func OptionGetterFn(getter GetterFn) Option {
	return OptionGetter(getter)
}

// Returns an option that adds a custom parser for environment variables.
func OptionParser(parser Parser) Option {
	return Option{Parser: parser}
}

// Returns an option that adds a custom parser for environment variables.
func OptionParserFn(parser ParserFn) Option {
	return OptionParser(parser)
}

// Returns an option that adds a custom validator for environment variables.
func OptionValidator(validator Validator) Option {
	return Option{Validator: validator}
}

// Returns an option that adds a custom validator for environment variables.
func OptionValidatorFn(validator ValidatorFn) Option {
	return OptionValidator(validator)
}

// Returns an option that adds a [github.com/go-playground/validator/v10] based
// validator for environment variables.
func OptionPlaygroundValidator() Option {
	return OptionValidator(PlaygroundValidator)
}

func resolveOptions(options []Option) Option {
	resolved := Option{}
	getters := []Getter{}
	parsers := []Parser{}
	validators := []Validator{}

	for _, o := range options {
		resolved.Prefix += o.Prefix

		if o.Getter != nil {
			getters = append(getters, o.Getter)
		}

		if o.Parser != nil {
			parsers = append(parsers, o.Parser)
		}

		if o.Validator != nil {
			validators = append(validators, o.Validator)
		}
	}

	if len(getters) == 0 {
		resolved.Getter = DefaultGetter
	} else {
		resolved.Getter = GetterFn(func(name string) (value string, ok bool) {
			for _, getter := range getters {
				if value, ok := getter.Get(name); ok {
					return value, true
				}
			}

			return "", false
		})
	}

	if len(parsers) == 0 {
		resolved.Parser = DefaultParser
	} else {
		resolved.Parser = ParserFn(func(in string, out reflect.Value) error {
			errs := []error{}

			for _, parser := range parsers {
				if err := parser.Parse(in, out); err != nil {
					errs = append(errs, err)
				}
			}

			return errors.Join(errs...)
		})
	}

	if len(validators) == 0 {
		resolved.Validator = ValidatorFn(func(value any) error {
			return nil
		})
	} else {
		errs := []error{}

		resolved.Validator = ValidatorFn(func(value any) error {
			for _, validator := range validators {
				if err := validator.Struct(value); err != nil {
					errs = append(errs, err)
				}
			}

			if len(errs) == 0 {
				return nil
			}

			if len(errs) == 1 {
				return errs[0]
			}

			return errors.Join(errs...)
		})
	}

	return resolved
}

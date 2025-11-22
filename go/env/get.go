package env

import (
	"fmt"
	"reflect"
)

func Get[T any](name string, options ...Option) (T, error) {
	prefix := ""
	lookups := []func(string) (string, bool){}
	parsers := []func(reflect.Type) func(value string) (any, error){}
	validators := []func(key string, value any) error{}

	for _, option := range options {
		if option.Prefix != "" {
			prefix += option.Prefix
		}

		if option.Lookup != nil {
			lookups = append(lookups, option.Lookup)
		}

		if option.Parser != nil {
			parsers = append(parsers, option.Parser)
		}

		if option.Validate != nil {
			validators = append(validators, option.Validate)
		}
	}

	if len(lookups) == 0 {
		lookups = append(lookups, defaultLookup)
	}

	lookup := func(name string) (string, bool) {
		for _, lookup := range lookups {
			if str, ok := lookup(name); ok {
				return str, ok
			}
		}

		return "", false
	}

	parser := func(t reflect.Type) func(value string) (any, error) {
		for _, parser := range parsers {
			if parse := parser(t); parse != nil {
				return parse
			}
		}

		return nil
	}

	validate := func(key string, value any) error {
		for _, validate := range validators {
			if err := validate(key, value); err != nil {
				return err
			}
		}

		return nil
	}

	var value T

	name = prefix + name

	if str, ok := lookup(name); ok {
		parsed, err := parse[T](str, parser)

		if err != nil {
			return value, fmt.Errorf("failed parsing config %q: %w", name, err)
		}

		value = parsed
	}

	if err := validate(name, value); err != nil {
		return value, err
	}

	return value, nil
}

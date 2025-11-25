package env

import (
	"errors"
	"fmt"
	"reflect"
)

// Get an environment variable by name, applying any provided options.
func Get[T any](key string, options ...Option) (T, error) {
	prefix := ""
	lookups := []func(key string) (string, bool){}
	parsers := []func(type_ reflect.Type, value string) (any, error){}
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

	key = prefix + key
	var str string
	var ok bool
	var value T

	if len(lookups) == 0 {
		str, ok = defaultLookup(key)
	} else {
		for _, lookup := range lookups {
			str, ok = lookup(key)

			if ok {
				break
			}
		}
	}

	if ok {
		parsed, err := parse[T](str, parsers)

		if errors.Is(err, ErrUnsupportedType) {
			return value, fmt.Errorf("unsupported type at config %q", key)
		} else if err != nil {
			return value, fmt.Errorf("failed parsing config %q: %w", key, err)
		}

		value = parsed
	}

	for _, validate := range validators {
		if err := validate(key, value); err != nil {
			return value, err
		}
	}

	return value, nil
}

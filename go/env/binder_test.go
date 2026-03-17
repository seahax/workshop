package env

import (
	"log/slog"
	"testing"

	"seahax.com/go/assert"
)

func TestLoad(t *testing.T) {
	type Config struct {
		Foo      string `env:"FOO"`
		Bar      string
		Int64    int64      `env:"NUMBER"`
		Float64  float64    `env:"FLOAT"`
		LogLevel slog.Level `env:"LOG_LEVEL"`
	}

	binder := Binder[Config]{Getter: Get(func(name string) (string, bool) {
		switch name {
		case "NUMBER":
			return "123", true
		case "FLOAT":
			return "123.456", true
		case "LOG_LEVEL":
			return "DEBUG", true
		}

		return name, true
	})}

	result, err := binder.Bind()

	assert.Equal(t, err, nil)
	assert.Equal(t, result.Foo, "FOO")
	assert.Equal(t, result.Bar, "")
	assert.Equal(t, result.Int64, 123)
	assert.Equal(t, result.Float64, 123.456)
	assert.Equal(t, result.LogLevel, slog.LevelDebug)
}

func TestValidationError(t *testing.T) {
	type Config struct {
		Foo string `env:"FOO" validate:"required"`
	}

	binder := Binder[Config]{Getter: Get(func(name string) (string, bool) {
		return "", true
	})}

	_, err := binder.Bind()

	assert.NotEqual(t, err, nil)
	assert.Equal(t, err.Error(), "value of \"FOO\" does not satisfy \"required\"")
}

func TestUnmarshalError(t *testing.T) {
	type Config struct {
		Foo slog.Level `env:"FOO"`
	}

	binder := Binder[Config]{Getter: Get(func(name string) (value string, ok bool) {
		return "asdf", true
	})}

	_, err := binder.Bind()

	assert.NotEqual(t, err, nil)
	assert.Equal(t, err.Error(), "failed parsing environment \"FOO\": slog: level string \"asdf\": unknown name")
}

func TestTypeError(t *testing.T) {
	type Config struct {
		Foo int64 `env:"FOO"`
	}

	binder := Binder[Config]{Getter: Get(func(name string) (value string, ok bool) {
		return "asdf", true
	})}

	_, err := binder.Bind()

	assert.NotEqual(t, err, nil)
	assert.Equal(t, err.Error(), "failed parsing environment \"FOO\": failed decoding int64 from \"asdf\"")
}

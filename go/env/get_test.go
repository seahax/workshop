package env

import (
	"log/slog"
	"testing"
)

func TestLoad(t *testing.T) {
	type Config struct {
		Foo      string `env:"FOO"`
		Bar      string
		Int64    int64      `env:"NUMBER"`
		Float64  float64    `env:"FLOAT"`
		LogLevel slog.Level `env:"LOG_LEVEL"`
	}

	result, err := Get[Config](OptionGetterFn(func(name string) (string, bool) {
		switch name {
		case "NUMBER":
			return "123", true
		case "FLOAT":
			return "123.456", true
		case "LOG_LEVEL":
			return "DEBUG", true
		}

		return name, true
	}))

	if err != nil {
		t.Error(err)
		return
	}

	if result.Foo != "FOO" {
		t.Errorf("Expected Foo %q, got %q", "FOO", result.Foo)
		return
	}

	if result.Bar != "" {
		t.Errorf("Expecting Bar %q, got %q", "", result.Bar)
		return
	}

	if result.Int64 != 123 {
		t.Errorf("Expected Int64 %d, got %d", 123, result.Int64)
		return
	}

	if result.Float64 != 123.456 {
		t.Errorf("Expected Float64 %f, got %f", 123.456, result.Float64)
		return
	}

	if result.LogLevel != slog.LevelDebug {
		t.Errorf("Expected LogLevel %q, got %q", slog.LevelDebug, result.LogLevel)
		return
	}
}

func TestValidationError(t *testing.T) {
	type Config struct {
		Foo string `env:"FOO" validate:"required"`
	}

	_, err := Get[Config](
		OptionPlaygroundValidator(),
		OptionGetterFn(func(name string) (value string, ok bool) {
			return "", true
		}),
	)

	if err == nil {
		t.Error("Expected validation error")
		return
	}

	expectedMessage := "Invalid environment \"FOO\" (required)"

	if err.Error() != expectedMessage {
		t.Errorf("Expected validation error message %q, go %q", expectedMessage, err.Error())
		return
	}
}

func TestUnmarshalError(t *testing.T) {
	type Config struct {
		Foo slog.Level `env:"FOO"`
	}

	_, err := Get[Config](OptionGetterFn(func(name string) (value string, ok bool) {
		return "asdf", true
	}))

	if err == nil {
		t.Error("Expected unmarshal error")
		return
	}

	expectedMessage := "Failed parsing environment \"FOO\": slog: level string \"asdf\": unknown name"

	if err.Error() != expectedMessage {
		t.Errorf("Expected unmarshal error message %q, got %q", expectedMessage, err.Error())
		return
	}
}

func TestTypeError(t *testing.T) {
	type Config struct {
		Foo int64 `env:"FOO"`
	}

	_, err := Get[Config](OptionGetterFn(func(name string) (value string, ok bool) {
		return "asdf", true
	}))

	if err == nil {
		t.Error("Expected parse error")
		return
	}

	expectedMessage := "Failed parsing environment \"FOO\": Failed decoding int64 from \"asdf\""

	if err.Error() != expectedMessage {
		t.Errorf("Expected unmarshal error message %q, got %q", expectedMessage, err.Error())
		return
	}
}

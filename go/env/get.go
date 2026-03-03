package env

// Bind environment variables to a new instance of the [T] tagged struct.
// Tag example: `env:"APP_ENVIRONMENT"`
func Get[T any](options ...Option) (*T, error) {
	var value T

	if err := Bind(&value, options...); err != nil {
		return nil, err
	}

	return &value, nil
}

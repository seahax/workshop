package env

import "fmt"

type BindEnvError struct {
	error
	EnvName   string
	FieldName string
}

func (e BindEnvError) Error() string {
	return fmt.Sprintf(`failed parsing environment %s: %v`, e.EnvName, e.error)
}

func (e BindEnvError) Unwrap() error {
	return e.error
}

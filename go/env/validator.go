package env

type Validator interface {
	Validate(value any) error
}

// Return an error if the opts struct is invalid.
type Validate func(value any) error

func (v Validate) Validate(value any) error {
	return v(value)
}

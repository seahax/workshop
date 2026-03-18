package command

// Error returned by [Command.Run] and [Command.RunArgs].
type Error struct {
	error
	IsParseFailure bool
}

// Create a new [Error].
func NewError(err error, isParseFailure bool) *Error {
	return &Error{error: err, IsParseFailure: isParseFailure}
}

// Unwrap the error to get the original error (ie. the cause).
func (e *Error) Unwrap() error {
	return e.error
}

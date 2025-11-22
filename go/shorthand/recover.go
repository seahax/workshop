package shorthand

import (
	"errors"
	"fmt"
)

// Invoke the callback if recovering.
func Recover(callback func(cause any)) {
	if cause := recover(); cause != nil {
		callback(cause)
	}
}

// Invoke the callback if recovering. If the recovered value is not an error,
// it will be converted to a string ([fmt.Sprint]) and wrapped in an error
// ([errors.New]).
func RecoverError(callback func(err error)) {
	if r := recover(); r != nil {
		if err, ok := r.(error); !ok {
			callback(errors.New(fmt.Sprint(r)))
		} else {
			callback(err)
		}
	}
}

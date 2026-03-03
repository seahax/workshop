package env

import "os"

// Environment variable getter.
type Getter interface {
	// Get the value of an environment variable. The `ok` return is `false` if
	// the variable is not set.
	Get(name string) (value string, ok bool)
}

// Function that implements the [Getter] type.
type GetterFn func(name string) (value string, ok bool)

func (fn GetterFn) Get(name string) (value string, ok bool) {
	return fn(name)
}

// Getter that uses the standard library's [os.LookupEnv] function.
var DefaultGetter GetterFn = os.LookupEnv

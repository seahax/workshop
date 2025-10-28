package env

import "os"

// env is an interface for looking up environment variables.
type env interface {
	LookupEnv(key string) (string, bool)
}

// osEnv is an implementation of Env that uses the OS environment variables.
type osEnv struct{}

func (e *osEnv) LookupEnv(key string) (string, bool) {
	return os.LookupEnv(key)
}

var defaultEnv env = &osEnv{}

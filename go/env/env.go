package env

import "os"

type Env interface {
	LookupEnv(key string) (string, bool)
}

type OSEnv struct{}

func (e *OSEnv) LookupEnv(key string) (string, bool) {
	return os.LookupEnv(key)
}

var defaultEnv Env = &OSEnv{}

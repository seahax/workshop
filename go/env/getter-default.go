package env

import "os"

var GetterDefault Getter = Get(func(name string) (string, bool) {
	return os.LookupEnv(name)
})

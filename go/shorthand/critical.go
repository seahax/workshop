package shorthand

// Panic if err is non-nil.
func Critical(err error) {
	if err != nil {
		panic(err)
	}
}

// Panic if err is non-nil, otherwise return value.
func CriticalValue[T any](value T, err error) T {
	if err != nil {
		panic(err)
	}

	return value
}

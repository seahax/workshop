package assert

import (
	"errors"
	"reflect"
	"regexp"
	"testing"
)

func Equal[T any](t *testing.T, got T, want T) {
	t.Helper()

	if !isEqual(got, want) {
		t.Fatalf("\nGOT:  %v\nWANT: %v\n", got, want)
	}
}

func NotEqual[T any](t *testing.T, got T, want T) {
	t.Helper()

	if isEqual(got, want) {
		t.Fatalf("\nGOT:  %v\nWANT: not an equal value\n", got)
	}
}

func RegexpMatch[T ~string](t *testing.T, got T, want string) {
	t.Helper()

	if !isRegexpMatch(got, want) {
		t.Fatalf("\nGOT:  %v\nWANT: to match regexp %q\n", got, want)
	}
}

func NotRegexpMatch[T ~string](t *testing.T, got T, want string) {
	t.Helper()

	if isRegexpMatch(got, want) {
		t.Fatalf("\nGOT:  %v\nWANT: not not match regexp %q\n", got, want)
	}
}

func ErrorIs(t *testing.T, got error, want error) {
	t.Helper()

	if !errors.Is(got, want) {
		t.Fatalf("\nGOT:  %v\nWANT: %v\n", got, want)
	}
}

func ErrorAs[T error](t *testing.T, got error) {
	t.Helper()

	if ok := errors.As(got, new(T)); !ok {
		t.Fatalf("\nGOT:  %v\nWANT: %v\n", reflect.TypeOf(got), reflect.TypeFor[T]())
	}
}

func Panic(t *testing.T, callback func()) {
	t.Helper()

	defer func() {
		recover()
	}()

	callback()
	t.Fatalf("\nGOT:  no panic\nWANT: panic\n")
}

func NotPanic(t *testing.T, callback func()) {
	t.Helper()

	defer func() {
		if err := recover(); err != nil {
			t.Fatalf("\nGOT:  %v\nWANT: no panic\n", err)
		}
	}()

	callback()
}

func isRegexpMatch[T ~string](got T, want string) bool {
	re := regexp.MustCompile(want)
	return re.MatchString(string(got))
}

func isEqual(got, want any) bool {
	if isNil(got) && isNil(want) {
		return true
	}

	return reflect.DeepEqual(got, want)
}

func isNil(got any) (result bool) {
	defer func() {
		if recover() != nil {
			result = false
		}
	}()

	return reflect.ValueOf(got).IsNil()
}

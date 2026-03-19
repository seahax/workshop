package assert

import (
	"errors"
	"fmt"
	"reflect"
	"regexp"
	"strings"
	"testing"
)

func Equal[T any](t *testing.T, got T, want T) {
	t.Helper()

	if !isEqual(got, want) {
		fatalf(t, got, "%v", want)
	}
}

func NotEqual[T any](t *testing.T, got T, want T) {
	t.Helper()

	if isEqual(got, want) {
		fatalf(t, got, "not an equal value")
	}
}

func RegexpMatch[T ~string](t *testing.T, got T, want string) {
	t.Helper()

	if !isRegexpMatch(got, want) {
		fatalf(t, got, "to match regexp %q", want)
	}
}

func NotRegexpMatch[T ~string](t *testing.T, got T, want string) {
	t.Helper()

	if isRegexpMatch(got, want) {
		fatalf(t, got, "not not match regexp %q", want)
	}
}

func ErrorIs(t *testing.T, got error, want error) {
	t.Helper()

	if !errors.Is(got, want) {
		fatalf(t, got, "%v", want)
	}
}

func ErrorAs[T error](t *testing.T, got error) {
	t.Helper()

	if ok := errors.As(got, new(T)); !ok {
		fatalf(t, reflect.TypeOf(got), "%v", reflect.TypeFor[T]())
	}
}

func Panic(t *testing.T, callback func()) {
	t.Helper()

	defer func() {
		recover()
	}()

	callback()
	fatalf(t, "no panic", "panic")
}

func NotPanic(t *testing.T, callback func()) {
	t.Helper()

	defer func() {
		if err := recover(); err != nil {
			fatalf(t, err, "no panic")
		}
	}()

	callback()
}
func isEqual[T any](got, want T) bool {
	if isNil(got) && isNil(want) {
		return true
	}

	if reflect.TypeFor[T]().Kind() == reflect.Slice {
		if reflect.ValueOf(got).Len() == 0 && reflect.ValueOf(want).Len() == 0 {
			// To empty slices (nil or not) are considered equal
			return true
		}
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

func isRegexpMatch[T ~string](got T, want string) bool {
	re := regexp.MustCompile(want)
	return re.MatchString(string(got))
}

func fatalf(t *testing.T, got any, format string, want ...any) {
	t.Helper()

	gotString := fmt.Sprintf("%v", got)
	wantString := fmt.Sprintf(format, want...)

	if strings.Contains(gotString, "\n") {
		gotString = "\n" + gotString
	}

	if strings.Contains(wantString, "\n") {
		wantString = "\n" + wantString
	}

	t.Fatalf("\nGOT:  %s\nWANT: %s\n", gotString, wantString)
}

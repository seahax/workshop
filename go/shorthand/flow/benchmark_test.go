package flow

import (
	"regexp"
	"strconv"
	"testing"
)

func BenchmarkFlow(b *testing.B) {
	for b.Loop() {
		withFlow(b.N)
	}
}

func BenchmarkWithoutFlow(b *testing.B) {
	for b.Loop() {
		withoutFlow(b.N)
	}
}

func withFlow(i int) (rx *regexp.Regexp, err error) {
	defer Recover(&err)

	value := TryValue(regexp.Compile("." + strconv.Itoa(i)))

	return Ok(value)
}

func withoutFlow(i int) (value *regexp.Regexp, err error) {
	value, err = regexp.Compile("." + strconv.Itoa(i))
	return value, err
}

package negotiator

import (
	"reflect"
	"testing"
)

type testHeader struct {
	isParameterized bool
	isMediaType     bool
	offers          []string
	cases           map[string]testCase
}

type testCase struct {
	values   []string
	expected []string
}

var headers = map[string]testHeader{
	"Accept": {
		offers:          []string{"text/html", "image/png", "application/json"},
		isParameterized: true,
		isMediaType:     true,
		cases: map[string]testCase{
			"Basic": {
				values:   []string{"application/json", "text/html;q=0.8", "image/*;q=0.5"},
				expected: []string{"application/json", "text/html", "image/png"},
			},
		},
	},
}

func TestNegotiation(t *testing.T) {
	for header, th := range headers {
		t.Run(header, func(t *testing.T) {
			negotiator := &Negotiator{
				IsParameterized: th.isParameterized,
				IsMediaType:     th.isMediaType,
				Offers:          th.offers,
			}

			for name, tc := range th.cases {
				t.Run(name, func(t *testing.T) {
					t.Run("MatchAll", func(t *testing.T) {
						result := negotiator.MatchAll(tc.values)

						if !reflect.DeepEqual(result, tc.expected) {
							t.Errorf("MatchAll expected %v, got %v", tc.expected, result)
						}
					})

					t.Run("Match", func(t *testing.T) {
						var expectedOk bool
						var expectedBest string

						if len(tc.expected) > 0 {
							expectedOk = true
							expectedBest = tc.expected[0]
						} else {
							expectedOk = false

							if len(th.offers) == 0 {
								expectedBest = ""
							} else {
								expectedBest = th.offers[0]
							}
						}

						best, ok := negotiator.Match(tc.values)

						if ok != expectedOk || best != expectedBest {
							t.Errorf("Match expected (%v, %v), got (%v, %v)", expectedBest, expectedOk, best, ok)
						}
					})
				})
			}
		})
	}
}

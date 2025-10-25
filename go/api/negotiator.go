package api

import (
	"slices"
	"strconv"
	"strings"
)

const maxQualityInt = 1000

// HTTP content negotiation helper.
type Negotiator struct {
	IsParameterized bool
	IsMediaType     bool
	Offers          []string
}

// Returns the best offer value that matches the header values.
//
// If no match is found, ok will be false and the value will be the first
// offer. The first offer is considered the "best" when no match is found.
func (n *Negotiator) Match(headerValues []string) (value string, ok bool) {
	matches := n.MatchAll(headerValues)

	if len(matches) == 0 {
		if len(n.Offers) == 0 {
			// No offers available
			return "", false
		}

		return n.Offers[0], false
	}

	return matches[0], true
}

// Returns all offers that match the header values, sorted (stably) by quality.
func (n *Negotiator) MatchAll(headerValues []string) []string {
	acceptQuality := map[string]int{}

	for _, headerValue := range headerValues {
		key := headerValue
		quality := maxQualityInt

		if n.IsParameterized {
			key, quality = parseParameterized(headerValue)
		}

		acceptQuality[key] = quality
	}

	offerQuality := map[string]int{}

	for _, key := range n.Offers {
		if quality, ok := acceptQuality[string(key)]; ok {
			offerQuality[key] = quality
			continue
		}

		if n.IsMediaType {
			baseType, _, _ := strings.Cut(string(key), "/")

			if quality, ok := acceptQuality[baseType+"/*"]; ok {
				offerQuality[key] = quality
				continue
			}

			if quality, ok := acceptQuality["*/*"]; ok {
				offerQuality[key] = quality
				continue
			}
		} else if quality, ok := acceptQuality["*"]; ok {
			offerQuality[key] = quality
			continue
		}
	}

	offers := slices.SortedStableFunc(slices.Values(n.Offers), func(a, b string) int {
		return offerQuality[b] - offerQuality[a]
	})

	return offers
}

func parseParameterized(value string) (base string, q int) {
	base, params, _ := strings.Cut(value, ";")
	base = strings.TrimSpace(base)

	for _, param := range strings.Split(params, ";") {
		k, v, _ := strings.Cut(strings.TrimSpace(param), "=")

		if k == "q" {
			if qualityFloat, err := strconv.ParseFloat(v, 64); err == nil {
				q = int(qualityFloat * maxQualityInt)
				return base, q
			}

			// Invalid quality values are treated as q=0
			return base, 0
		}
	}

	return base, maxQualityInt
}

package xhealth

import "encoding/json"

type Status int

const (
	StatusUnknown Status = iota
	StatusHealthy
	StatusUnhealthy
)

func (s Status) String() string {
	switch s {
	case StatusHealthy:
		return "healthy"
	case StatusUnhealthy:
		return "unhealthy"
	default:
		return "unknown"
	}
}

func (s Status) MarshalJSON() ([]byte, error) {
	return json.Marshal(s.String())
}

func (s *Status) UnmarshalJSON(data []byte) error {
	switch string(data) {
	case `"healthy"`:
		*s = StatusHealthy
	case `"unhealthy"`:
		*s = StatusUnhealthy
	default:
		*s = StatusUnknown
	}

	return nil
}

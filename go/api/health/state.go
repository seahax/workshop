package health

import "sync"

// A serializable snapshot of the health state.
type Snapshot struct {
	Status Status            `json:"status"`
	Detail map[string]Status `json:"detail"`
}

// Thread-safe health state.
type State struct {
	state sync.Map
}

// Set the health status of a component (thread-safe).
func (s *State) Set(component string, status Status) {
	s.state.Store(component, status)
}

// Get a snapshot of the current health state (thread-safe). Includes
// overall status and per-component details.
func (s *State) Snapshot() *Snapshot {
	overall := StatusHealthy
	detail := map[string]Status{}

	s.state.Range(func(key any, value any) bool {
		if k, ok := key.(string); ok {
			if v, ok := value.(Status); ok {
				overall = max(overall, v)
				detail[k] = v
			}
		}

		return true
	})

	return &Snapshot{
		Status: overall,
		Detail: detail,
	}
}

type Status string

const (
	StatusUnknownHealth Status = "unknown"
	StatusHealthy       Status = "healthy"
	StatusUnhealthy     Status = "unhealthy"
)

package health

// A serializable snapshot of the health state.
type Snapshot struct {
	Status Status            `json:"status"`
	Detail map[string]Status `json:"detail"`
}

// Get a snapshot of the current health state (thread-safe). Includes
// overall status and per-component details.
func NewSnapshot(values map[string]*Value) *Snapshot {
	overall := StatusHealthy
	detail := map[string]Status{}

	for k, v := range values {
		status := v.Load()
		detail[k] = status

		if status == StatusUnhealthy {
			overall = StatusUnhealthy
		}
	}

	return &Snapshot{
		Status: overall,
		Detail: detail,
	}
}

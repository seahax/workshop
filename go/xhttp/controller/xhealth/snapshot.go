package xhealth

// Serializable snapshot of health statuses.
type Snapshot struct {
	Status Status            `json:"status"`
	Detail map[string]Status `json:"detail"`
}

// Create a snapshot of the current application health. Includes overall status
// and per-component details.
func NewSnapshot(values map[string]*AtomicStatus) *Snapshot {
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

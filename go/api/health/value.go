package health

import "sync/atomic"

// A thread-safe health status value.
type Value struct {
	status atomic.Int64
}

// Update the health status value.
func (v *Value) Store(status Status) {
	v.status.Store(int64(status))
}

// Load the current health status value.
func (v *Value) Load() Status {
	status := Status(v.status.Load())
	return status
}

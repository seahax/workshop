package api

import (
	"net/http"
	"sync/atomic"
	"time"
)

type writer struct {
	http.ResponseWriter
	writeHeaderTime atomic.Int64
	status          atomic.Int32
}

func (r *writer) WriteHeader(statusCode int) {
	if r.writeHeaderTime.CompareAndSwap(0, time.Now().UnixMilli()) {
		r.status.Store(int32(statusCode))
	}

	r.ResponseWriter.WriteHeader(statusCode)
}

func (r *writer) Written() bool {
	return r.writeHeaderTime.Load() != 0
}

// Returns the time in milliseconds since the epoch when the response headers
// were written. If the headers have not been written yet, it returns 0.
func (r *writer) WriteHeaderTime() int64 {
	return r.writeHeaderTime.Load()
}

func (r *writer) Status() int {
	return int(r.status.Load())
}

func (r *writer) Write(data []byte) (int, error) {
	if r.writeHeaderTime.Load() == 0 {
		r.WriteHeader(http.StatusOK)
	}

	return r.ResponseWriter.Write(data)
}

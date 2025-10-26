package api

import (
	"net/http"
	"time"
)

type writer struct {
	http.ResponseWriter
	writeHeaderTime int64
	status          int
}

func (r *writer) WriteHeader(statusCode int) {
	r.writeHeaderTime = time.Now().UnixMilli()
	r.status = statusCode
	r.ResponseWriter.WriteHeader(statusCode)
}

func (r *writer) Written() bool {
	return r.writeHeaderTime != 0
}

// Returns the time in milliseconds since the epoch when the response headers
// were written. If the headers have not been written yet, it returns 0.
func (r *writer) WriteHeaderTime() int64 {
	return r.writeHeaderTime
}

func (r *writer) Status() int {
	return r.status
}

func (r *writer) Write(data []byte) (int, error) {
	if r.writeHeaderTime == 0 {
		r.WriteHeader(http.StatusOK)
	}

	return r.ResponseWriter.Write(data)
}

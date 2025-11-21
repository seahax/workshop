package xhttp

import (
	"context"
	"fmt"
	"net/http"
)

// Request context key and accessors for values of type T.
type RequestContext[T any] struct {
	Name       string
	GetDefault func() T
}

// Return the value associated with this Key in the [context.Context] of the
// [net/http.Request]. If no value is associated, the default value is
// returned.
func (k *RequestContext[T]) Value(request *http.Request) T {
	val, ok := request.Context().Value(k).(T)

	if !ok {
		return k.GetDefault()
	}

	return val
}

// Create a shallow copy of the [net/http.Request] with a derived
// [context.Context] where the value is associated with this Key.
func (k *RequestContext[T]) WithValue(request *http.Request, value T) *http.Request {
	return request.WithContext(context.WithValue(request.Context(), k, value))
}

func (k *RequestContext[T]) String() string {
	return fmt.Sprintf("xcontext.Key[%s]", k.Name)
}

// Create a request context key and accessors for values of type T.
func NewRequestContext[T any](name string, getDefault func() T) *RequestContext[T] {
	return &RequestContext[T]{
		Name:       name,
		GetDefault: getDefault,
	}
}

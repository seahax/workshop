package shorthand

import (
	"context"
)

// Typed context key with optional default value. This uses a pointer to itself
// as a unique context key.
type ContextKey[T any] struct {
	Default func() T
}

// Return the context value associated to this key. If no value is found, the
// default value is returned. If no default value is set, the zero value of T
// is returned.
func (k *ContextKey[T]) Value(ctx context.Context) T {
	val, ok := ctx.Value(k).(T)

	if ok {
		return val
	}

	if k.Default == nil {
		var zero T
		return zero
	}

	return k.Default()
}

// Return a new context with the value associated to this key.
func (k *ContextKey[T]) ApplyValue(ctx context.Context, value T) context.Context {
	return context.WithValue(ctx, k, value)
}

// Return a new context key with a default value function. The default value
// function can be nil.
func NewContextKey[T any](getDefault func() T) *ContextKey[T] {
	return &ContextKey[T]{
		Default: getDefault,
	}
}

package shorthand

import (
	"context"
	"math"
	"time"
)

// Retry is an object that performs actions with retry logic.
type Retry struct {
	// Number of retries, not including the first attempt.
	Count int
	// Calculate the delay before each retry. The index i starts at 1 for the
	// first retry.
	Backoff func(i int) time.Duration
	// Maximum backoff duration. If non-zero, the duration calculated by Backoff
	// is capped to this value.
	MaxBackoff time.Duration
	// Handle the final error after all retries have been exhausted or when the
	// context is Done.
	Error func(error)
}

// Perform the action with retry logic.
func (r *Retry) Do(action func() error) error {
	return r.DoContext(context.Background(), action)
}

// Perform the action with retry logic and a context that can be used to cancel
// or timeout the retry loop.
func (r *Retry) DoContext(ctx context.Context, action func() error) error {
	var err error

	for i := 0; i <= max(r.Count, 0); i++ {
		if i > 0 {
			delay := time.Duration(0)

			if r.Backoff != nil {
				delay = r.Backoff(i)
			}

			if r.MaxBackoff > 0 && delay > r.MaxBackoff {
				delay = r.MaxBackoff
			}

			select {
			case <-ctx.Done():
			case <-time.After(delay):
			}
		}

		err = ctx.Err()

		if err != nil {
			break
		}

		err = action()

		if err == nil {
			break
		}
	}

	if err != nil && r.Error != nil {
		r.Error(err)
	}

	return err
}

// Create a constant time backoff strategy. Each retry will be delayed by the
// base amount of time.
func NewConstantBackoff(base time.Duration) func(i int) time.Duration {
	return func(_ int) time.Duration {
		return base
	}
}

// Create a linear time backoff strategy. Each retry will be delayed by i*base,
// where i is the retry index starting at 1.
func NewLinearBackoff(base time.Duration) func(i int) time.Duration {
	return func(i int) time.Duration {
		return time.Duration(int64(base) * int64(i))
	}
}

// Create an exponential time backoff strategy. Each retry will be delayed by
// base^i, where i is the retry index starting at 1.
func NewExponentialBackoff(base time.Duration) func(i int) time.Duration {
	return func(i int) time.Duration {
		return time.Duration(math.Floor(math.Pow(float64(base), float64(i))))
	}
}

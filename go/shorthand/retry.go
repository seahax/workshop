package shorthand

import (
	"context"
	"math"
	"math/rand"
	"time"
)

// Retry is an object that performs actions with retry logic.
type Retry struct {
	// Number of retries, not including the first attempt.
	Count int64
	// Calculate the delay before each retry. The index i starts at 1 for the
	// first retry.
	Backoff *Backoff
}

// Perform the action with retry logic.
func (r *Retry) Do(action func() error) error {
	return r.DoContext(context.Background(), action)
}

// Perform the action with retry logic and a context that can be used to cancel
// or timeout the retry loop.
func (r *Retry) DoContext(ctx context.Context, action func() error) error {
	var err error

	for i := int64(0); i <= max(r.Count, 0); i++ {
		if i > 0 {
			delay := time.Duration(0)

			if r.Backoff != nil {
				delay = r.Backoff.Calculate(i)
			}

			if delay > 0 {
				select {
				case <-ctx.Done():
				case <-time.After(delay):
				}
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

	return err
}

// Retry Backup delay calculation strategy.
type Backoff struct {
	Algorithm func(i int64) time.Duration
	Jitter    bool
	Cap       time.Duration
}

// Calculate the delay for the given retry index (1-based).
func (b *Backoff) Calculate(i int64) time.Duration {
	delay := time.Duration(0)

	if b.Algorithm != nil {
		delay = b.Algorithm(i)
	}

	if b.Cap > 0 {
		delay = min(delay, b.Cap)
	}

	if b.Jitter {
		delay = time.Duration(math.Floor(rand.Float64() * float64(delay)))
	}

	return delay
}

// Return a copy of the Backoff that limits the maximum length of each
// calculated delay.
func (b *Backoff) WithCap(cap time.Duration) *Backoff {
	backoff := *b
	backoff.Cap = cap
	return &backoff
}

// Return a copy of the Backoff that adds jitter to each calculated delay.
func (b *Backoff) WithJitter() *Backoff {
	backoff := *b
	backoff.Jitter = true
	return &backoff
}

// Create a constant time backoff strategy. Each retry will be delayed by the
// base amount of time.
func NewConstantBackoff(base time.Duration) *Backoff {
	return &Backoff{
		Algorithm: func(_ int64) time.Duration {
			return base
		},
	}
}

// Create a linear time backoff strategy. Each retry will be delayed by i*base,
// where i is the retry index starting at 1.
func NewLinearBackoff(base time.Duration) *Backoff {
	return &Backoff{
		Algorithm: func(i int64) time.Duration {
			return time.Duration(int64(base) * i)
		},
	}
}

// Create an exponential time backoff strategy. Each retry will be delayed by
// base*(2^(i-1)), where i is the retry index starting at 1.
func NewExponentialBackoff(base time.Duration) *Backoff {
	return &Backoff{
		Algorithm: func(i int64) time.Duration {
			mult := int64(math.Pow(2, float64(i-1)))
			return time.Duration(int64(base) * mult)
		},
	}
}

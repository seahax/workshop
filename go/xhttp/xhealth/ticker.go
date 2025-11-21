package xhealth

import (
	"sync/atomic"
	"time"
)

// Health ValueProvider that runs a health check function at regular intervals
// to update its status.
//
// Use the NewTicker constructor to create Ticker instances.
type Ticker struct {
	ticker   *time.Ticker
	checking atomic.Bool
	check    func() Status
	value    Value
	done     chan bool
}

// Create a new Ticker that runs the provided health check function at the
// specified interval. The first check is performed after the initial interval
// elapses. Call the Tick method to perform an immediate check.
func NewTicker(interval time.Duration, check func() Status) *Ticker {
	self := &Ticker{
		ticker: time.NewTicker(interval),
		check:  check,
		done:   make(chan bool, 1),
	}

	go func() {
		for {
			select {
			case <-self.done:
				self.ticker.Stop()
				return
			case <-self.ticker.C:
				self.Tick()
			}
		}
	}()

	return self
}

// Perform a single extra health check immediately.
func (t *Ticker) Tick() {
	// Skip ticks if the previous check is still running.
	if !t.checking.CompareAndSwap(false, true) {
		return
	}

	go func() {
		defer func() {
			if r := recover(); r != nil {
				t.value.Store(StatusUnhealthy)
			}

			t.checking.Store(false)
		}()

		t.value.Store(t.check())
	}()
}

// Return the most recent status value produced by the ticker's health check
// function.
func (t *Ticker) Load() Status {
	return t.value.Load()
}

// Change the ticker's interval to the specified duration and reset the ticker
// start time. The next tick will occur after the first new interval elapses.
func (t *Ticker) Reset(interval time.Duration) {
	t.ticker.Reset(interval)
}

// Stop the ticker. No further automatic health checks will be performed,
// though calling the Tick method will still work.
func (t *Ticker) Stop() {
	select {
	case t.done <- true:
	default:
	}
}

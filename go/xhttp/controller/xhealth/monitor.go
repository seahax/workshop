package xhealth

import (
	"sync/atomic"
	"time"
)

type Monitor struct {
	Status   AtomicStatus
	ticker   *time.Ticker
	checking atomic.Bool
	check    func() Status
	done     chan bool
}

// Create a new health Monitor that runs the provided health check function at
// the specified interval. The first check is performed after the initial
// interval elapses. Call the Check method to perform an immediate check.
func NewMonitor(interval time.Duration, check func() Status) *Monitor {
	monitor := &Monitor{
		ticker: time.NewTicker(interval),
		check:  check,
		done:   make(chan bool, 1),
	}

	go func() {
		for {
			select {
			case <-monitor.done:
				monitor.ticker.Stop()
				return
			case <-monitor.ticker.C:
				monitor.Check()
			}
		}
	}()

	return monitor
}

func (m *Monitor) Check() {
	// Skip ticks if the previous check is still running.
	if !m.checking.CompareAndSwap(false, true) {
		return
	}

	go func() {
		defer func() {
			if r := recover(); r != nil {
				m.Status.Store(StatusUnhealthy)
			}

			m.checking.Store(false)
		}()

		m.Status.Store(m.check())
	}()
}

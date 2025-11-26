package shorthand

import (
	"slices"
	"sync"
)

// A thread-safe event channel (pubsub).
//
// Unlike channels, the subscriber is invoked in the publisher's gorouting,
// which is the goroutine that calls the Notify method. All methods are
// synchronized. Subscribers are guaranteed to be called in the order they were
// added. The slowest operation is unsubscribing, which is O(n) where n is the
// number of subscribers.
type Observable[T any] struct {
	mut           sync.RWMutex
	subscriptions []*Subscription[T]
}

// Register a callback to be called when Notify is called.
func (o *Observable[T]) Subscribe(subscriber func(T)) *Subscription[T] {
	subscription := &Subscription[T]{subscriber: subscriber}
	subscription.unsubscribe = func() {
		o.mut.Lock()
		defer o.mut.Unlock()
		if i := slices.Index(o.subscriptions, subscription); i != -1 {
			o.subscriptions = slices.Delete(o.subscriptions, i, i+1)
		}
	}

	o.mut.Lock()
	o.subscriptions = append(o.subscriptions, subscription)
	o.mut.Unlock()

	return subscription
}

// Remove all subscriptions.
func (o *Observable[T]) Clear() {
	o.mut.Lock()
	o.subscriptions = nil
	o.mut.Unlock()
}

// Notify all subscribers with the given data. Subscribers are notified in the
// order they were added.
func (o *Observable[T]) Notify(data T) {
	o.mut.RLock()
	subscriptions := o.subscriptions
	o.mut.RUnlock()

	for _, subscription := range subscriptions {
		subscription.subscriber(data)
	}
}

// Notify all subscribers with the given data. Subscribers are notified in the
// reverse order they were added.
func (o *Observable[T]) NotifyBackwards(data T) {
	o.mut.RLock()
	subscriptions := o.subscriptions
	o.mut.RUnlock()

	for _, subscription := range slices.Backward(subscriptions) {
		subscription.subscriber(data)
	}
}

type Subscription[T any] struct {
	subscriber  func(T)
	unsubscribe func()
}

func (s *Subscription[T]) Unsubscribe() {
	s.unsubscribe()
}

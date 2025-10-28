package shorthand

import (
	"slices"
	"sync"
)

type ObservableValue[T any] struct {
	mut           sync.RWMutex
	subscriptions []*subscription[T]
}

type Unsubscribe func()

type subscription[T any] struct {
	subscriber func(T)
}

func (o *ObservableValue[T]) Subscribe(subscriber func(T)) Unsubscribe {
	subscription := &subscription[T]{subscriber: subscriber}
	o.mut.Lock()
	o.subscriptions = append(o.subscriptions, subscription)
	o.mut.Unlock()

	return func() {
		o.mut.Lock()
		defer o.mut.Unlock()
		if i := slices.Index(o.subscriptions, subscription); i != -1 {
			o.subscriptions = slices.Delete(o.subscriptions, i, i+1)
		}
	}
}

func (o *ObservableValue[T]) Clear() {
	o.mut.Lock()
	o.subscriptions = nil
	o.mut.Unlock()
}

func (o *ObservableValue[T]) Notify(data T) {
	o.mut.RLock()
	subscriptions := o.subscriptions
	o.mut.RUnlock()

	for _, subscription := range subscriptions {
		subscription.subscriber(data)
	}
}

func (o *ObservableValue[T]) NotifyBackwards(data T) {
	o.mut.RLock()
	subscriptions := o.subscriptions
	o.mut.RUnlock()

	for _, subscription := range slices.Backward(subscriptions) {
		subscription.subscriber(data)
	}
}

type Observable struct {
	internal ObservableValue[any]
}

func (o *Observable) Subscribe(subscriber func()) Unsubscribe {
	return o.internal.Subscribe(func(_ any) {
		subscriber()
	})
}

func (o *Observable) Clear() {
	o.internal.Clear()
}

func (o *Observable) Notify() {
	o.internal.Notify(nil)
}

func (o *Observable) NotifyBackwards() {
	o.internal.NotifyBackwards(nil)
}

package shorthand

import (
	"os"
	"os/signal"
	"syscall"
)

// Block until an [os.Signal] is received. If no signals are provided, it
// defaults to listening for [os.Interrupt], [os.Kill], and [syscall.SIGTERM].
func WaitForSignal(signals ...os.Signal) {
	if len(signals) == 0 {
		signals = []os.Signal{os.Interrupt, os.Kill, syscall.SIGTERM}
	}

	signalChan := make(chan os.Signal, 1)
	signal.Notify(signalChan, signals...)
	<-signalChan
}

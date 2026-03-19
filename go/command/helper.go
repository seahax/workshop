package command

// Help string factory.
type Helper interface {
	// Return a help string for the given [CommandImmutable].
	Help(command CommandImmutable) string
}

// Return a help string for the given [CommandImmutable].
type Help func(command CommandImmutable) string

func (h Help) Help(command CommandImmutable) string {
	return h(command)
}

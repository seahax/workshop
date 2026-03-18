package command

// Help string factory.
type Helper interface {
	// Return a help string for the given [CommandDescription].
	Help(command CommandDescription) string
}

// Return a help string for the given [CommandDescription].
type Help func(command CommandDescription) string

func (h Help) Help(command CommandDescription) string {
	return h(command)
}

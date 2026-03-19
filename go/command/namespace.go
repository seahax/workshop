package command

import "fmt"

// Create a new [Command] that does not have an action and requires a
// subcommand.
func Namespace(name string, summary string, modifiers ...Modifier) Command[struct{}] {
	return New(name, summary, func(opts *struct{}) error {
		return NewError(fmt.Errorf("missing required subcommand"), true)
	}, modifiers...)
}

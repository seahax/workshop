package command

import "fmt"

type namespaceOpts struct {
	Extra []string `flag:"<extra...>"`
}

// Create a new [Command] that does not have an action and requires a
// subcommand.
func Namespace(name string, summary string, modifiers ...Modifier) Command[namespaceOpts] {
	return New(name, summary, func(opts *namespaceOpts) error {
		if len(opts.Extra) > 0 {
			return NewError(fmt.Errorf("invalid subcommand %q", opts.Extra[0]), true)
		}

		return NewError(fmt.Errorf("missing required subcommand"), true)
	}, modifiers...)
}

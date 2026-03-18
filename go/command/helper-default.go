package command

import "fmt"

// Default help string factory.
var HelperDefault Helper = Help(func(command CommandDescription) string {
	b := NewHelperBuilder()
	hasOptions := false
	hasArguments := false
	hasCommands := false

	b.WriteParagraph(command.Summary)
	b.WriteParagraph(command.Prologue)

	b.WriteListHeading("Options:")
	positionals := []Field{}

	for field := range FieldIterator(command.Type) {
		help := field.Help()

		if help == "" {
			// Fields without a help tag are hidden from help text.
			continue
		}

		if !field.IsNamedFlag() {
			positionals = append(positionals, field)
			continue
		}

		b.WriteListItem(field.Flag(), help)
		hasOptions = true
	}

	b.WriteListHeading("Arguments:")

	for _, field := range positionals {
		b.WriteListItem(field.Flag(), field.Help())
		hasArguments = true
	}

	b.WriteListHeading("Commands:")

	for _, subcommand := range command.Subcommands {
		desc := subcommand.Describe()
		if desc.Summary != "" {
			hasCommands = true
			b.WriteListItem(desc.Name, desc.Summary)
		}
	}

	if command.Usage == "" {
		if hasOptions && hasArguments {
			b.WriteUsage(fmt.Sprintf("Usage: %s <options> <arguments>", command.Name))
		} else if hasOptions {
			b.WriteUsage(fmt.Sprintf("Usage: %s <options>", command.Name))
		} else if hasArguments {
			b.WriteUsage(fmt.Sprintf("Usage: %s <arguments>", command.Name))
		}

		if hasCommands {
			b.WriteUsage(fmt.Sprintf("Usage: %s <command> ...", command.Name))
		}
	} else {
		b.WriteUsage(command.Usage)
	}

	b.WriteParagraph(command.Epilogue)

	return b.String()
})

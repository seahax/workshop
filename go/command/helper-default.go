package command

import "fmt"

// Default help string factory.
var HelperDefault Helper = Help(func(command CommandImmutable) string {
	b := NewHelperBuilder()
	hasOptions := false
	hasArguments := false
	hasCommands := false

	b.WriteParagraph(command.Summary())

	for prologue := range command.Prologue() {
		b.WriteParagraph(prologue)
	}

	b.WriteListHeading("Options:")
	positionals := []Field{}

	for field := range FieldIterator(command.Type()) {
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

	for subcommand := range command.Subcommands() {
		summary := subcommand.Summary()

		if summary != "" {
			hasCommands = true
			b.WriteListItem(subcommand.Name(), summary)
		}
	}

	hasUsage := false

	for usage := range command.Usage() {
		hasUsage = true
		b.WriteUsage(usage)
	}

	if !hasUsage {
		if hasOptions && hasArguments {
			b.WriteUsage(fmt.Sprintf("Usage: %s <options> <arguments>", command.Fullname()))
		} else if hasOptions {
			b.WriteUsage(fmt.Sprintf("Usage: %s <options>", command.Fullname()))
		} else if hasArguments {
			b.WriteUsage(fmt.Sprintf("Usage: %s <arguments>", command.Fullname()))
		} else {
			b.WriteUsage(fmt.Sprintf("Usage: %s", command.Fullname()))
		}

		if hasCommands {
			b.WriteUsage(fmt.Sprintf("Usage: %s <command> ...", command.Fullname()))
		}
	}

	for epilogue := range command.Epilogue() {
		b.WriteParagraph(epilogue)
	}

	return b.String()
})

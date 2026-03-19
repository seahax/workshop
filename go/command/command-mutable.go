package command

import "io"

type CommandMutable interface {
	CommandImmutable

	SetName(name string)
	SetSummary(summary string)

	SetUsage(usage ...string)
	AddUsage(usage string)

	SetPrologue(prologue ...string)
	AddPrologue(prologue string)

	SetEpilogue(epilogue ...string)
	AddEpilogue(epilogue string)

	SetSubcommands(subcommands ...Subcommand)
	AddSubcommand(subcommand Subcommand)

	SetOutput(output io.Writer)
	SetHelper(helper Helper)
	SetDecoder(decoder Decoder)
	SetValidator(validator Validator)
}

func (c *Command[T]) SetName(name string) {
	c.name = name
}

func (c *Command[T]) SetSummary(summary string) {
	c.summary = summary
}

func (c *Command[T]) SetUsage(usage ...string) {
	c.usage = usage
}

func (c *Command[T]) AddUsage(usage string) {
	c.usage = append(c.usage, usage)
}

func (c *Command[T]) SetPrologue(prologue ...string) {
	c.prologue = prologue
}

func (c *Command[T]) AddPrologue(prologue string) {
	c.prologue = append(c.prologue, prologue)
}

func (c *Command[T]) SetEpilogue(epilogue ...string) {
	c.epilogue = epilogue
}

func (c *Command[T]) AddEpilogue(epilogue string) {
	c.epilogue = append(c.epilogue, epilogue)
}

func (c *Command[T]) SetSubcommands(subcommands ...Subcommand) {
	c.subcommands = subcommands
}

func (c *Command[T]) AddSubcommand(subcommand Subcommand) {
	c.subcommands = append(c.subcommands, subcommand)
}

func (c *Command[T]) SetOutput(output io.Writer) {
	c.output = output
}

func (c *Command[T]) SetHelper(helper Helper) {
	c.helper = helper
}

func (c *Command[T]) SetDecoder(decoder Decoder) {
	c.decoder = decoder
}

func (c *Command[T]) SetValidator(validator Validator) {
	c.validator = validator
}

package command

import (
	"fmt"
	"io"
	"os"
	"reflect"

	"seahax.com/go/shorthand"
)

// Command definition including the struct type, action to run, subcommands,
// help texts, etc.
type Command[T any] struct {
	parentFullname string

	Action      func(opts *T) error
	Name        string
	Usage       string
	Summary     string
	Prologue    string
	Epilogue    string
	Subcommands []Subcommand

	Helper    Helper
	Decoder   Decoder
	Validator Validator
	Output    io.Writer
}

// Subcommand interface. All commands are also inherently subcommands.
type Subcommand interface {
	Describe() CommandDescription
	RunAsSubcommand(output io.Writer, parentFullname string, args []string) *Error
}

// Create a new [Command].
func New[T any](name string, summary string, action func(opts *T) error, subcommands ...Subcommand) Command[T] {
	return Command[T]{
		Name:        name,
		Summary:     summary,
		Action:      action,
		Subcommands: subcommands,
	}
}

// Full name of the command, including all parent commands.
func (c Command[T]) Fullname() string {
	if c.parentFullname != "" {
		return fmt.Sprintf("%s %s", c.parentFullname, c.Name)
	}

	return c.Name
}

// Get command help text.
func (c Command[T]) String() string {
	helper := shorthand.Coalesce(c.Helper, HelperDefault)
	return helper.Help(c.Describe())
}

// Print command help text to the output writer.
func (c Command[T]) PrintHelp() {
	if help := c.String(); help != "" {
		fmt.Fprintln(c.output(), help)
	}
}

// Return a command description struct for the current command. This is used to
// generate help text.
func (c Command[T]) Describe() CommandDescription {
	return NewCommandDescription(c)
}

// Run the command with the process arguments.
func (c Command[T]) Run() *Error {
	return c.RunArgs(os.Args[1:])
}

// Run the command with the provided arguments.
func (c Command[T]) RunArgs(args []string) *Error {
	if len(args) > 0 {
		for _, subcommand := range c.Subcommands {
			if subcommand.Describe().Name == args[0] {
				return subcommand.RunAsSubcommand(c.output(), c.Fullname(), args[1:])
			}
		}
	}

	structType := reflect.TypeFor[T]()
	decoder := shorthand.Coalesce(c.Decoder, DecoderDefault)
	parser := NewParser(structType, decoder)
	parsedPtr, err := parser.Parse(args)

	if err != nil {
		return NewError(err, true)
	}

	validator := shorthand.Coalesce(c.Validator, ValidatorDefault)

	if err := validator.Validate(parsedPtr); err != nil {
		return NewError(err, true)
	}

	if err := c.Action(parsedPtr.(*T)); err != nil {
		return NewError(err, false)
	}

	return nil
}

// Run the command with the process arguments and exit with an appropriate
// status code.
func (c Command[T]) RunAndExit() {
	c.RunArgsAndExit(os.Args[1:])
}

// Run the command with the provided arguments and exit with an appropriate
// status code.
func (c Command[T]) RunArgsAndExit(args []string) {
	if err := c.RunArgs(args); err != nil {
		if err.IsParseFailure {
			c.PrintHelp()
		}

		fmt.Fprintln(c.output(), err.Error())

		if err.IsParseFailure {
			os.Exit(1)
		} else {
			os.Exit(2)
		}
	}

	os.Exit(0)
}

// Run the command as a subcommand, inheriting the parent command's output
// writer and name.
func (c Command[T]) RunAsSubcommand(output io.Writer, parentFullname string, args []string) *Error {
	c.parentFullname = parentFullname
	c.Output = output
	return c.RunArgs(args)
}

// Get the non-nil output writer, defaulting to [os.Stderr] if no writer is
// explicitly set.
func (c Command[T]) output() io.Writer {
	return shorthand.Coalesce[io.Writer](c.Output, os.Stderr)
}

// Run a command with the process arguments.
func Run[T any](name string, description string, action func(opts *T) error, subcommands ...Subcommand) *Error {
	return New(name, description, action, subcommands...).Run()
}

// Run a command with the provided arguments.
func RunArgs[T any](name string, description string, action func(opts *T) error, args []string, subcommands ...Subcommand) *Error {
	return New(name, description, action, subcommands...).RunArgs(args)
}

// Run a command with the process arguments and exit with an appropriate status
// code.
func RunAndExit[T any](name string, description string, action func(opts *T) error, subcommands ...Subcommand) {
	New(name, description, action, subcommands...).RunAndExit()
}

// Run a command with the provided arguments and exit with an appropriate
// status code.
func RunArgsAndExit[T any](name string, description string, action func(opts *T) error, args []string, subcommands ...Subcommand) {
	New(name, description, action, subcommands...).RunArgsAndExit(args)
}

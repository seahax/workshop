package command

import (
	"errors"
	"flag"
	"fmt"
	"io"
	"os"
	"reflect"

	"seahax.com/go/shorthand"
)

// Command definition including the struct type, action to run, subcommands,
// help texts, etc.
type Command[T any] struct {
	action func(opts *T) error
	exit   func(code int)
	parent CommandImmutable

	name        string
	summary     string
	usage       []string
	prologue    []string
	epilogue    []string
	subcommands []Subcommand

	output    io.Writer
	helper    Helper
	decoder   Decoder
	validator Validator
}

// Subcommand interface. All commands are also inherently subcommands.
type Subcommand interface {
	CommandImmutable
	RunAsSubcommand(parent CommandImmutable, args []string) *Error
}

// Create a new [Command].
func New[T any](name string, summary string, action func(opts *T) error, modifiers ...Modifier) Command[T] {
	cmd := Command[T]{
		name:    name,
		summary: summary,
		action:  action,
	}

	for _, modifier := range modifiers {
		modifier.Modify(&cmd)
	}

	return cmd
}

// Run the command with the process arguments.
func (c Command[T]) Run() *Error {
	return c.RunArgs(os.Args[1:])
}

// Run the command with the provided arguments.
func (c Command[T]) RunArgs(args []string) *Error {
	if len(args) > 0 {
		for _, subcommand := range c.subcommands {
			if subcommand.Name() == args[0] {
				return subcommand.RunAsSubcommand(c, args[1:])
			}
		}
	}

	structType := reflect.TypeFor[T]()
	decoder := shorthand.Coalesce(c.decoder, DecoderDefault)
	parser := NewParser(structType, decoder)
	parsedPtr, err := parser.Parse(args)

	if err != nil {
		return &Error{error: err, command: c, IsParseFailure: true}
	}

	validator := shorthand.Coalesce(c.validator, PlaygroundValidator)

	if err := validator.Validate(parsedPtr); err != nil {
		return &Error{error: err, command: c, IsParseFailure: true}
	}

	if err := c.action(parsedPtr.(*T)); err != nil {
		if err, ok := err.(*Error); ok {
			err.command = c
			return err
		}

		return &Error{error: err, command: c, IsParseFailure: false}
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
	exit := shorthand.Coalesce(c.exit, os.Exit)

	if err := c.RunArgs(args); err != nil {
		if err.IsParseFailure {
			err.command.PrintHelp()
		}

		if errors.Is(err, flag.ErrHelp) {
			exit(0)
			return
		}

		fmt.Fprintln(c.Output(), err.Error())

		if err.IsParseFailure {
			exit(1)
			return
		}

		exit(2)
		return
	}

	exit(0)
}

// Run the command as a subcommand, inheriting the parent command's output
// writer and name.
func (c Command[T]) RunAsSubcommand(parent CommandImmutable, args []string) *Error {
	c.parent = parent
	return c.RunArgs(args)
}

// Add this command as a subcommand to the provided parent command.
func (c Command[T]) Modify(parent CommandMutable) {
	parent.AddSubcommand(c)
}

// Run a command with the process arguments.
func Run[T any](name string, description string, action func(opts *T) error, modifiers ...Modifier) *Error {
	return New(name, description, action, modifiers...).Run()
}

// Run a command with the provided arguments.
func RunArgs[T any](name string, description string, action func(opts *T) error, args []string, modifiers ...Modifier) *Error {
	return New(name, description, action, modifiers...).RunArgs(args)
}

// Run a command with the process arguments and exit with an appropriate status
// code.
func RunAndExit[T any](name string, description string, action func(opts *T) error, modifiers ...Modifier) {
	New(name, description, action, modifiers...).RunAndExit()
}

// Run a command with the provided arguments and exit with an appropriate
// status code.
func RunArgsAndExit[T any](name string, description string, action func(opts *T) error, args []string, modifiers ...Modifier) {
	New(name, description, action, modifiers...).RunArgsAndExit(args)
}

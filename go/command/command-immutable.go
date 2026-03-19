package command

import (
	"fmt"
	"io"
	"iter"
	"os"
	"reflect"
	"slices"

	"seahax.com/go/shorthand"
)

type CommandImmutable interface {
	Type() reflect.Type
	Parent() CommandImmutable
	Name() string
	Fullname() string
	Summary() string
	Usage() iter.Seq[string]
	Prologue() iter.Seq[string]
	Epilogue() iter.Seq[string]
	Subcommands() iter.Seq[CommandImmutable]
	PrintHelp()
	String() string
	Output() io.Writer
	Helper() Helper
	Decoder() Decoder
	Validator() Validator
}

func (c Command[T]) Type() reflect.Type {
	return reflect.TypeFor[T]()
}

func (c Command[T]) Parent() CommandImmutable {
	return c.parent
}

func (c Command[T]) Name() string {
	return c.name
}

// Full name of the command, including all parent commands.
func (c Command[T]) Fullname() string {
	var parentName string

	if c.parent != nil {
		parentName = c.parent.Fullname()
	}

	if parentName != "" {
		return fmt.Sprintf("%s %s", parentName, c.name)
	}

	return c.name
}

func (c Command[T]) Summary() string {
	return c.summary
}

func (c Command[T]) Usage() iter.Seq[string] {
	return slices.Values(c.usage)
}

func (c Command[T]) Prologue() iter.Seq[string] {
	return slices.Values(c.prologue)
}

func (c Command[T]) Epilogue() iter.Seq[string] {
	return slices.Values(c.epilogue)
}

func (c Command[T]) Subcommands() iter.Seq[CommandImmutable] {
	return func(yield func(CommandImmutable) bool) {
		for _, subcommand := range c.subcommands {
			if !yield(subcommand) {
				return
			}
		}
	}
}

// Get command help text.
func (c Command[T]) String() string {
	helper := shorthand.Coalesce(c.helper, HelperDefault)
	return helper.Help(c)
}

// Print command help text to the output writer.
func (c Command[T]) PrintHelp() {
	if help := c.String(); help != "" {
		fmt.Fprintln(c.Output(), help)
	}
}

// Get the non-nil Output writer, defaulting to [os.Stderr] if no writer is
// explicitly set.
func (c Command[T]) Output() io.Writer {
	if c.parent != nil {
		return c.parent.Output()
	}

	return shorthand.Coalesce[io.Writer](c.output, os.Stderr)
}

func (c Command[T]) Helper() Helper {
	return shorthand.Coalesce(c.helper, HelperDefault)
}

func (c Command[T]) Decoder() Decoder {
	return shorthand.Coalesce(c.decoder, DecoderDefault)
}

func (c Command[T]) Validator() Validator {
	return shorthand.Coalesce(c.validator, PlaygroundValidator)
}

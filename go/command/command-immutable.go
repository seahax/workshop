package command

import (
	"fmt"
	"io"
	"iter"
	"os"
	"reflect"
	"regexp"
	"slices"
	"strings"

	"seahax.com/go/shorthand"
)

var commandNameSplit = regexp.MustCompile(`[ ,|]`)

type CommandImmutable interface {
	Type() reflect.Type
	Parent() CommandImmutable
	Name() string
	Names() iter.Seq[string]
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

func (c Command[T]) Names() iter.Seq[string] {
	return func(yield func(string) bool) {
		for _, name := range commandNameSplit.Split(c.name, -1) {
			name = strings.TrimSpace(name)

			if name == "" {
				continue
			}

			if !yield(name) {
				return
			}
		}
	}
}

// Full name of the command, including all parent commands.
func (c Command[T]) Fullname() string {
	var parentName string

	if c.parent != nil {
		parentName = c.parent.Fullname()
	}

	firstName := shorthand.FirstSeqValue(c.Names())

	if parentName != "" {
		return fmt.Sprintf("%s %s", parentName, firstName)
	}

	return firstName
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

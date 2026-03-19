package command

import (
	"bytes"
	"testing"

	"seahax.com/go/assert"
	"seahax.com/go/shorthand"
)

func TestParsing(t *testing.T) {
	type Opts struct {
		Opt  int      `flag:"--int"`
		Bool bool     `flag:"-b"`
		Arg  string   `flag:"<arg>"`
		Args []string `flag:"<args...>"`
	}

	var count int
	var opts *Opts
	cmd := New("test", "", func(o *Opts) error {
		count++
		opts = o
		return nil
	})

	err := cmd.RunArgs([]string{})

	assert.Equal(t, err, nil)
	assert.Equal(t, count, 1)
	assert.Equal(t, opts.Opt, 0)
	assert.Equal(t, opts.Bool, false)
	assert.Equal(t, opts.Arg, "")
	assert.Equal(t, opts.Args, []string{})

	err = cmd.RunArgs([]string{"--int", "123", "-b", "value", "abc", "def"})

	assert.Equal(t, err, nil)
	assert.Equal(t, count, 2)
	assert.Equal(t, opts, &Opts{
		Opt:  123,
		Bool: true,
		Arg:  "value",
		Args: []string{"abc", "def"},
	})

	// Re-use overwrites original value
	err = cmd.RunArgs([]string{"--int", "1", "--int", "2", "-b", "-b=false"})

	assert.Equal(t, err, nil)
	assert.Equal(t, opts, &Opts{
		Opt:  2,
		Bool: false,
	})
}

func TestTooManyArgs(t *testing.T) {
	type Opts struct {
		Arg string `flag:"<arg>"`
	}

	var count int
	var opts *Opts
	cmd := New("test", "", func(o *Opts) error {
		count++
		opts = o
		return nil
	})

	err := cmd.RunArgs([]string{"a"})
	assert.Equal(t, err, nil)
	assert.Equal(t, opts, &Opts{
		Arg: "a",
	})

	err = cmd.RunArgs([]string{"a", "b"})
	assert.NotEqual(t, err, nil)
	assert.Equal(t, err.Error(), "too many arguments")
}

func TestValidate(t *testing.T) {
	type Opts struct {
		Foo string `flag:"--foo <uuid>" validate:"uuid"`
		Bar string `flag:"--bar <ip>" validate:"ip"`
	}

	cmd := New("test", "", func(_ *Opts) error {
		return nil
	})

	err := cmd.RunArgs([]string{"--foo", "not a uuid", "--bar", "not an ip"})

	assert.NotEqual(t, err, nil)
	assert.Equal(t, err.Error(), shorthand.Multiline(`
	| value of "--foo <uuid>" does not satisfy "uuid"
	| value of "--bar <ip>" does not satisfy "ip"
	`))
}

func TestHelp(t *testing.T) {
	type Opts struct {
		Opt int      `flag:"-o, --opt <value>" help:"This is an option"`
		Flg bool     `flag:"-f, --flag" help:"This is an option that does not need a value"`
		Rpt []string `flag:"-r, --repeat <value>" help:"This is a repeatable option"`
		Arg int      `flag:"<value>" help:"This is an argument"`
		Rst []string `flag:"<rest...>" help:"This is a variadic argument"`
	}

	cmd := New("test", "The root command",
		func(opts *Opts) error {
			return nil
		},
		Modify(func(command CommandMutable) {
			command.AddEpilogue("The end.")
		}),
		New("subcommand", "A subcommand", func(opts *struct{}) error {
			return nil
		}),
	)

	assert.Equal(t, cmd.String(), shorthand.Multiline(`
	| Usage: test <options> <arguments>
	| Usage: test <command> ...
	|
	| The root command
	|
	| Options:
	|   -o, --opt <value>
	|       This is an option
	|   -f, --flag
	|       This is an option that does not need a value
	|   -r, --repeat <value>
	|       This is a repeatable option
	|
	| Arguments:
	|   <value>
	|       This is an argument
	|   <rest...>
	|       This is a variadic argument
	|
	| Commands:
	|   subcommand
	|       A subcommand
	|
	| The end.
	|
	`))
}

func TestSubcommandHelp(t *testing.T) {
	code := -1
	output := &bytes.Buffer{}

	cmd := Namespace("command", "",
		New("subcommand", "Hello world!", func(opts *struct{}) error {
			return nil
		}),
	)
	cmd.exit = func(newCode int) {
		code = newCode
	}
	cmd.output = output
	cmd.RunArgsAndExit([]string{"subcommand", "--help"})

	assert.Equal(t, code, 0)
	assert.Equal(t, output.String(), shorthand.Multiline(`
	| Usage: command subcommand
	|
	| Hello world!
	|
	|
	`))
}

func TestSubcommandInvalid(t *testing.T) {
	code := -1
	output := &bytes.Buffer{}

	cmd := Namespace("command", "",
		New("subcommand", "Hello world!", func(opts *struct{}) error {
			return nil
		}),
	)
	cmd.exit = func(newCode int) {
		code = newCode
	}
	cmd.output = output
	cmd.RunArgsAndExit([]string{"subcommand", "extra"})

	assert.Equal(t, code, 1)
	assert.Equal(t, output.String(), shorthand.Multiline(`
	| Usage: command subcommand
	|
	| Hello world!
	|
	| too many arguments
	|
	`))
}

func TestNamespaceSubcommandMismatch(t *testing.T) {
	cmd := Namespace("command", "")

	err := cmd.RunArgs([]string{"non-existent"})
	assert.Equal(t, err.Error(), "invalid subcommand \"non-existent\"")

	err = cmd.RunArgs([]string{})
	assert.Equal(t, err.Error(), "missing required subcommand")
}

func TestMinimalCommandHelp(t *testing.T) {
	cmd := New("command", "", func(opts *struct{}) error {
		return nil
	})

	assert.Equal(t, cmd.String(), shorthand.Multiline(`
	| Usage: command
	|
	`))
}

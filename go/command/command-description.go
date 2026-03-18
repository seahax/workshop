package command

import (
	"reflect"
)

// Command description struct for use in generating help text.
type CommandDescription struct {
	Type        reflect.Type
	Name        string
	Usage       string
	Summary     string
	Prologue    string
	Epilogue    string
	Subcommands []Subcommand
}

// Create a new [CommandDescription].
func NewCommandDescription[T any](command Command[T]) CommandDescription {
	return CommandDescription{
		Name:        command.Name,
		Usage:       command.Usage,
		Summary:     command.Summary,
		Prologue:    command.Prologue,
		Epilogue:    command.Epilogue,
		Type:        reflect.TypeFor[T](),
		Subcommands: command.Subcommands,
	}
}

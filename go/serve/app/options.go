package app

import (
	"flag"
	"fmt"
	"net/http"
	"os"
)

// Options parsed from command line arguments.
type Options struct {
	Root           http.Dir
	Addr           string
	ConfigFilename string
}

// Get Options parsed from command line arguments.
func LoadOptions() *Options {
	var opts Options
	var root string

	fs := flag.NewFlagSet("serve", flag.ExitOnError)
	fs.StringVar(&root, "root", ".", "root directory for served files")
	fs.StringVar(&opts.Addr, "addr", ":8080", "server address")
	fs.StringVar(&opts.ConfigFilename, "config", "", "JSON config file path")
	fs.Parse(os.Args[1:])

	opts.Root = http.Dir(root)

	if len(fs.Args()) > 0 {
		usageError(fs, fmt.Errorf("too many arguments"))
	}

	return &opts
}

func usageError(fs *flag.FlagSet, err error) {
	fmt.Fprintf(os.Stderr, "%v\n", err)
	fs.Usage()
	os.Exit(1)
}

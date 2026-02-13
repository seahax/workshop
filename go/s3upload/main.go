package main

import (
	"context"
	"flag"
	"fmt"
	"os"
	"path/filepath"
	"reflect"
	"regexp"
	"strings"

	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/feature/s3/transfermanager"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"seahax.com/go/s3upload/provide"
	"seahax.com/go/s3upload/publish"
)

func main() {
	var root, bucket, prefix, storageClass, cacheControl, region string
	var filters []provide.DirectoryFilter
	var dryRun bool

	flag.CommandLine.Usage = func() {
		out := flag.CommandLine.Output()
		fmt.Fprintln(out, "Usage of s3upload:")
		flag.PrintDefaults()
		// Describe positional arguments
		fmt.Fprintln(out, "  [files...]")
		fmt.Fprintf(out, "    \tOptional list of files to upload\n")
	}
	flag.BoolVar(&dryRun, "dry-run", false, "Print uploads without performing them")
	flag.StringVar(&root, "root", ".", "Content root directory `path`")
	flag.StringVar(&region, "region", "", "S3 bucket region `identifier`")
	flag.StringVar(&bucket, "bucket", "", "S3 bucket `name`")
	flag.StringVar(&prefix, "prefix", "", "S3 object prefix `path`")
	flag.StringVar(&storageClass, "storage-class", "INTELLIGENT_TIERING", "S3 object storage class `identifier`")
	flag.StringVar(&cacheControl, "cache-control", "", "S3 object Cache-Control metadata `directive`")

	// Include and exclude options can be used more than once.
	flag.Func("include",
		"Include files with relative paths matching the `regex` pattern (repeatable)"+
			"\nOnly valid if no specific [files...] are provided",
		func(regexpPattern string) error {
			return addFilter(&filters, regexpPattern, provide.DirectoryInclude)
		})
	flag.Func("i", "Alias for -include `regexp`", func(regexpPattern string) error {
		return addFilter(&filters, regexpPattern, provide.DirectoryInclude)
	})
	flag.Func("exclude",
		"Exclude files with relative paths matching the `regex` pattern (repeatable)"+
			"\nOnly valid if no specific [files...] are provided",
		func(regexpPattern string) error {
			return addFilter(&filters, regexpPattern, provide.DirectoryExclude)
		})
	flag.Func("e", "Alias for -exclude `regexp`", func(regexpPattern string) error {
		return addFilter(&filters, regexpPattern, provide.DirectoryExclude)
	})

	flag.Parse()

	root, err := filepath.Abs(root)
	assert(err == nil, err)

	bucket = strings.TrimSpace(bucket)
	prefix = strings.TrimSpace(prefix)
	region = strings.TrimSpace(region)
	files := flag.Args()

	assert(len(files) == 0 || len(filters) == 0, "Cannot use include/exclude with specific files")
	assert(bucket, "S3 bucket name is required")

	fmt.Printf("Source: %s\n", root)
	fmt.Printf("Bucket: %s\n", bucket)

	if storageClass != "" {
		fmt.Printf("StorageClass: %s\n", storageClass)
	}

	if cacheControl != "" {
		fmt.Printf("CacheControl: %s\n", cacheControl)
	}

	if dryRun {
		fmt.Println("DryRun: true")
	}

	fmt.Println()

	cfg, err := config.LoadDefaultConfig(context.TODO(), config.WithRegion(region))
	assert(err == nil, err)

	client := s3.NewFromConfig(cfg)
	uploader := transfermanager.New(client)
	publisher := publish.NewPublisher(uploader, bucket,
		publish.WithDryRun(dryRun),
		publish.WithPrefix(prefix),
		publish.WithStorageClass(storageClass),
		publish.WithCacheControl(cacheControl),
		publish.WithContentType(),
		publish.WithPrint(true),
	)

	var content publish.Content

	if len(files) > 0 {
		content = provide.Files(root, files...)
	} else {
		content = provide.Directory(root, filters...)
	}

	err = publisher.Publish(content)
	assert(err == nil, err)
}

// Exit if the value is non-zero. Should only be used in main().
func assert[T any](value T, message any) {
	if reflect.ValueOf(value).IsZero() {
		fmt.Fprintln(os.Stderr, message)
		os.Exit(1)
	}
}

func addFilter(
	slice *[]provide.DirectoryFilter,
	regexPattern string,
	createFilter func(provide.DirectoryFilterFn) provide.DirectoryFilter,
) error {
	rx, err := regexp.Compile(regexPattern)

	if err != nil {
		return err
	}

	*slice = append(*slice, createFilter(func(entry *provide.DirectoryFilterEntry) bool {
		return rx.MatchString(entry.Path)
	}))

	return nil
}

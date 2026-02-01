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
	"github.com/aws/aws-sdk-go-v2/feature/s3/manager"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"seahax.com/go/s3upload/provide"
	"seahax.com/go/s3upload/publish"
)

func main() {
	var root, bucket, prefix, storageClass, cacheControl, region string
	var include = []provide.DirectoryFilter{}
	var exclude = []provide.DirectoryFilter{}
	var dryRun bool

	flag.CommandLine.Usage = func() {
		out := flag.CommandLine.Output()
		fmt.Fprintln(out, "Usage of s3-upload:")
		flag.PrintDefaults()
		fmt.Fprintln(out, "  [files...]")
		fmt.Fprintf(out, "    \tOptional list of files to upload\n")
	}
	flag.StringVar(&root, "root", ".", "Content root directory `path`")
	flag.StringVar(&region, "region", "", "S3 bucket region `identifier`")
	flag.StringVar(&bucket, "bucket", "", "S3 bucket `name`")
	flag.StringVar(&prefix, "prefix", "", "S3 object prefix `path`")
	flag.StringVar(&storageClass, "storage-class", "INTELLIGENT_TIERING", "S3 object storage class `identifier`")
	flag.StringVar(&cacheControl, "cache-control", "", "S3 object Cache-Control metadata `directive`")
	flag.Func("include",
		"Include files with relative paths matching the `regex` pattern\nOnly valid if no specific [files...] are provided",
		func(regexpPattern string) error {
			return addFilter(&include, regexpPattern)
		})
	flag.Func("i", "Alias for -include `regexp`", func(regexpPattern string) error {
		return addFilter(&include, regexpPattern)
	})
	flag.Func("exclude",
		"Exclude files with relative paths matching the `regex` pattern\nOnly valid if no specific [files...] are provided",
		func(regexpPattern string) error {
			fmt.Println("Adding exclude filter:", regexpPattern)
			return addFilter(&exclude, regexpPattern)
		})
	flag.Func("e", "Alias for -exclude `regexp`", func(regexpPattern string) error {
		return addFilter(&exclude, regexpPattern)
	})
	flag.BoolVar(&dryRun, "dry-run", false, "Print uploads without performing them")
	flag.Parse()

	files := flag.Args()
	assert(len(files) == 0 || len(include) == 0 && len(exclude) == 0, "Cannot use include/exclude with specific files")
	fmt.Println(len(exclude))

	root, err := filepath.Abs(root)
	assert(err == nil, err)

	bucket = strings.TrimSpace(bucket)
	assert(bucket, "S3 bucket name is required")

	prefix = strings.TrimSpace(prefix)
	region = strings.TrimSpace(region)

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
	uploader := manager.NewUploader(client)
	publisher := publish.Publisher{
		Uploader: uploader,
		Bucket:   bucket,
		Plugins: []publish.Plugin{
			publish.WithPrefix(prefix),
			publish.WithStorageClass(storageClass),
			publish.WithCacheControl(cacheControl),
			publish.WithContentType(),
			publish.WithPrint(true),
		},
		DryRun: dryRun,
	}

	var content provide.Content

	if len(files) > 0 {
		content = &provide.Files{
			Root:  root,
			Paths: files,
		}
	} else {
		content = &provide.Directory{
			Root:    root,
			Include: include,
			Exclude: exclude,
		}
	}

	err = publisher.Publish(provide.Set{content})
	assert(err == nil, err)
}

// Exit if the value is non-zero. Should only be used in main().
func assert[T any](value T, message any) {
	if reflect.ValueOf(value).IsZero() {
		fmt.Fprintln(os.Stderr, message)
		os.Exit(1)
	}
}

func addFilter(slice *[]provide.DirectoryFilter, regexPattern string) error {
	rx, err := regexp.Compile(regexPattern)

	if err != nil {
		return err
	}

	*slice = append(*slice, func(entry *provide.DirectoryFilterEntry) bool {
		return rx.MatchString(entry.Path)
	})

	return nil
}

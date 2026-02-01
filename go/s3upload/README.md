# seahax.com/go/s3upload

Yet another S3 uploader.

## Command

```sh
go install seahax.com/go/s3upload

s3upload \
  -root path/to/content \
  -include '^/assets/' \
  -exclude '(^|/)\.' \
  -region us-east-1 \
  -bucket my-bucket \
  -prefix my-prefix \
  -storage-class INTELLIGENT_TIERING \
  -cache-control max-age=3600 \
  -dry-run
```

Run `s3upload --help` for more information about options.

## Import

```go
package main

import (
  "fmt"
  "os"
  "regexp"

  "github.com/aws/aws-sdk-go-v2/config"
  "github.com/aws/aws-sdk-go-v2/feature/s3/manager"
  "github.com/aws/aws-sdk-go-v2/feature/s3"
  "seahax.com/go/s3upload/publish"
  "seahax.com/go/s3upload/provide"
)

func main() {
  cfg, err := config.LoadDefaultConfig(context.TODO(),
    config.WithRegion("us-east-1")
  )
  
  if err != nil {
    panic(err)
  }

  client := s3.NewFromConfig(cfg)
  uploader := manager.NewUploader(client)
  publisher := publish.NewPublisher(uploader, "my-bucket",
    publish.WithDryRun(true),
    publish.WithPrefix("my-prefix"),
    publish.WithCacheControl("max-age=3600"),
    publish.WithStorageClass(types.StorageClassIntelligentTiering),
    publish.WithContentType(),
    publish.WithPrint(),
  )

  includePattern := regexp.MustCompile(`^/assets/`)
  excludePattern := regexp.MustCompile(`(^|/)\.`)
  content := provide.Directory("path/to/content",
    provide.DirectoryInclude(func(entry *provide.DirectoryFilterEntry) bool {
      return includePattern.MatchString(entry.Path)
    }),
    provide.DirectoryExclude(func(entry *provide.DirectoryFilterEntry) bool {
      return excludePattern.MatchString(entry.Path)
    }),
  )

  err = publisher.Publish(content)

  if err != nil {
    fmt.Fprintln(os.Stderr, err)
    os.Exit(1)
  }
}
```

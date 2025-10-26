# seahax.com/go/env

Bind environment variables to Go structs using struct tags.

- Parse string, bool, and all numeric types.
- Use initial struct values as defaults.
- Skip unexported fields and fields without `env` tags.

```go
import (
  "log"
  "sync"

  "seahax.com/go/env"
)

struct Config {
  Environment    string `env:"APP_ENVIRONMENT"`
  DatabaseURL    string `env:"APP_DATABASE_URL"`
  ThreadCount    int    `env:"APP_THREAD_COUNT"`
  StartTime      int64 // No tag, so not bound.
}

var LoadConfig = sync.OnceValue(func() *Config {
  cfg := &Config{
    // Initial value used as default if environment variable not set.
    Environment: "development",
  }

  if err := env.Bind(cfg); err != nil {
    log.Fatalf("failed to load config from environment: %v", err)
  }

  return cfg
})
```
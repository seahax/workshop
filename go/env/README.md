# seahax.com/env

Bind environment variables to structs using struct tags.

- Parses string, bool, and all numeric types by default.
- Uses initial struct values as defaults.
- Skips unexported fields and fields without `env` tags.
- Supports prefixes, continue-on-error mode, and custom parsers.

```go
import (
  "log"
  "sync"

  "seahax.com/env"
)

struct Config {
  Environment    string `env:"ENVIRONMENT"`
  DatabaseURL    string `env:"DATABASE_URL"`
  ThreadCount    int    `env:"THREAD_COUNT"`
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

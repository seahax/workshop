# seahax.com/go/env

Bind environment variables to structs using struct tags.

- Parses string, bool, and all numeric types by default.
- Uses initial struct values as defaults.
- Skips unexported fields and fields without `env` tags.
- Supports prefixes, continue-on-error mode, and custom parsers.

## Usage

Define a struct with `env` tags.

```go
struct Config {
  Environment    string `env:"ENVIRONMENT"`
  DatabaseURL    string `env:"DATABASE_URL"`
  ThreadCount    int    `env:"THREAD_COUNT"`
  StartTime      int64 // No tag, so not bound.
}
```

Bind with default options.

```go
var myStruct Config
err := env.Bind(&myStruct)
```

Bind to prefixed environment variables.

```go
var myStruct Config
binder := env.Binder{Prefix: "APP_"}
err := binder.Bind(&myStruct)
```

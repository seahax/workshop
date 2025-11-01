# seahax.com/go/api

Utility for composing HTTP services.

```go
import (
  "seahax.com/go/api"
  "seahax.com/go/api/health"
  "seahax.com/go/api/log"
  "seahax.com/go/api/secure"
  "seahax.com/go/api/compress"
  "seahax.com/go/api/info"
  "seahax.com/go/api/static"
)

// Track health status
state := &health.State{}
state.Set("db", health.StatusHealthy)

app := &api.API{}

// Add middleware
app.UseMiddleware(&log.Middleware{})
app.UseMiddleware(&secure.Middleware{})
app.UseMiddleware(&compress.Middleware{})

// Configure routes
app.HandleRoute(&health.Route{ State: state })
app.HandleRoute(&info.Route{
  JSON: map[string]any{
    "startTimestamp": time.Now().UnixMilli(),
  },
})
app.HandleRoute(&static.Route{
  RootDir: "/path/to/static/files",
  SpaIndex: "index.html",
})

// Listen and serve
app.BindAddress(":8080")
```

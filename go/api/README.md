# seahax.com/go/api

Utility for composing HTTP services.

```go
import (
  "seahax.com/go/api"
  "seahax.com/go/api/log"
  "seahax.com/go/api/secure"
  "seahax.com/go/api/compress"
)

app := &api.API{}

// Add middleware
app.UseMiddleware(&log.Middleware{})
app.UseMiddleware(&secure.Middleware{})
app.UseMiddleware(&compress.Middleware{})

// Configure routes
app.HandleRoute(&api.Route{
  Pattern: "GET /hello",
  Handler: func(ctx *api.Context) {
    ctx.Response.WriteString("Hello, World!")
  },
})

// Listen and serve
app.BindAddress(":8080")
```

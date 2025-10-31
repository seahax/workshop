# seahax.com/go/serve

A simple production ready static HTTP server.

Features:
- CORS
- Cache-Control
- Custom headers
- Logging
- Request timeouts
- Compression

## Dev

```sh
# Run locally
go run main.go

# Build the docker image
mise docker_build

# Build and run the docker image
mise docker_start
```

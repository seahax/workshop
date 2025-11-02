# seahax.com/go/serve

A simple production ready static HTTP server.

Features:
- Logging
- GZip Compression
- CORS
- Cache Control
- No dotfiles
- No directory listings

## Dev

```sh
# Run locally
go run main.go

# Build the docker image
mise docker_build

# Build and run the docker image
mise docker_start
```

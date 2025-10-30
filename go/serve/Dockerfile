FROM cgr.dev/chainguard/static:latest
COPY dist/serve /serve
WORKDIR /
ENTRYPOINT [ "/serve", "--cache-control", "/cache-control.json", "/content" ]
USER nonroot
EXPOSE 8080

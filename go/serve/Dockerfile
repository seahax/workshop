FROM cgr.dev/chainguard/static:latest
COPY dist/serve /serve
COPY files /app
ENTRYPOINT [ "/serve", "--addr", ":8080", "--root", "/app/content", "--config", "/app/config.json" ]
EXPOSE 8080

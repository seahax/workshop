FROM cgr.dev/chainguard/static:latest
COPY files .
COPY dist/serve /serve
ENTRYPOINT [ "/serve", "--addr", ":8080", "--root", "/content" ]
EXPOSE 8080

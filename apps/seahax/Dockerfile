FROM ubuntu:24.04

LABEL org.opencontainers.image.source=https://github.com/seahax/

RUN apt-get update
RUN apt-get install -y curl
RUN curl -fsSL https://deb.nodesource.com/setup_22.x | bash -s
RUN apt-get install -y nodejs
RUN adduser --system --no-create-home app

COPY dist /app

USER app
CMD ["node", "/app/backend/index.mjs"]

EXPOSE 8080

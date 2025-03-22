FROM ubuntu:24.04

RUN apt-get update
RUN apt-get install -y curl
RUN curl -fsSL https://deb.nodesource.com/setup_22.x | bash -s
RUN apt-get install -y nodejs

COPY dist /app
EXPOSE 8080
CMD ["node", "/app/backend/index.mjs"]

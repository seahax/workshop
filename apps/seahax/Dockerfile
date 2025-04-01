FROM ubuntu:24.04


RUN apt-get update
RUN apt-get install -y curl
RUN curl -fsSL https://deb.nodesource.com/setup_22.x | bash -s
RUN apt-get install -y nodejs
RUN adduser --system --no-create-home app

COPY backend/dist /app/backend
COPY frontend/dist /app/frontend

USER app
ARG APP_COMMIT
ARG APP_BUILD_TIMESTAMP
ENV APP_COMMIT=${APP_COMMIT}
ENV APP_BUILD_TIMESTAMP=${APP_BUILD_TIMESTAMP}
ENV APP_STATIC_PATH=/app/frontend
ENV NODE_OPTIONS=--enable-source-maps
CMD ["node", "/app/backend/index.mjs"]

EXPOSE 8080

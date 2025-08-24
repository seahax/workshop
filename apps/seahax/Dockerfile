FROM node:lts-alpine

ARG APP_COMMIT
ARG APP_BUILD_TIMESTAMP

ENV APP_COMMIT=${APP_COMMIT}
ENV APP_BUILD_TIMESTAMP=${APP_BUILD_TIMESTAMP}
ENV APP_STATIC_PATH=/home/app/frontend
ENV APP_HOSTNAME=0.0.0.0
ENV APP_PORT=8080
ENV NODE_OPTIONS=--enable-source-maps

RUN apk update && apk upgrade

RUN adduser --system app
WORKDIR /home/app
USER app
COPY --chown=app:app backend/dist backend
COPY --chown=app:app frontend/dist frontend

CMD ["node", "/home/app/backend/index.mjs"]
EXPOSE 8080

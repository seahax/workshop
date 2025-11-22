FROM alpine:3

ARG APP_COMMIT
ARG APP_BUILD_TIMESTAMP

ENV APP_COMMIT=${APP_COMMIT}
ENV APP_BUILD_TIMESTAMP=${APP_BUILD_TIMESTAMP}
ENV APP_STATIC_PATH=/home/app/frontend
ENV APP_ADDRESS=0.0.0.0:8080
ENV APP_LOG_FORMAT=json

RUN apk update && apk upgrade

RUN adduser --system app
COPY --chown=app:app frontend/dist /home/app/frontend
COPY --chown=app:app api/dist/api /home/app

USER app
WORKDIR /home/app
CMD ["/home/app/api"]
EXPOSE 8080

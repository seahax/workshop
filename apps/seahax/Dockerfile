FROM alpine:3

ARG APP_COMMIT
ARG APP_BUILD_TIMESTAMP

ENV APP_COMMIT=${APP_COMMIT}
ENV APP_BUILD_TIMESTAMP=${APP_BUILD_TIMESTAMP}
ENV APP_STATIC_PATH=/home/app/frontend
ENV APP_HOSTNAME=0.0.0.0
ENV APP_PORT=8080

RUN apk update && apk upgrade

RUN adduser --system app
COPY --chown=app:app frontend/dist /home/app/frontend
COPY --chown=app:app api/dist/api /home/app

USER app
WORKDIR /home/app
CMD ["/home/app/api"]
EXPOSE 8080

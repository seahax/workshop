FROM ubuntu:24.04

RUN apt-get update
RUN apt-get install -y curl
RUN curl -fsSL https://deb.nodesource.com/setup_22.x | bash -s
RUN apt-get install -y nodejs
RUN adduser --system --no-create-home app

COPY backend/dist /app/backend
COPY frontend/dist /app/frontend

USER app
ENV FRONTEND_PATH=/app/frontend
CMD ["node", "/app/backend/index.mjs"]

EXPOSE 8080

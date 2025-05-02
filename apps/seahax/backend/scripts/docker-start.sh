#!/usr/bin/env bash
docker run -it --rm --network=host \
  -e APP_ORIGIN='http://127.0.0.1:8080' \
  -e APP_DATABASE_URL='mongodb://127.0.0.1:27017' \
  -e APP_PEPPER=LocalPepper \
  app-seahax-backend

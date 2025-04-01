# app-seahax-backend

NodeJS backend for the Seahax app.

## Local Development

MongoDB needs to be running locally for the backend to work. The easiest way to do this is with the following docker command.

```bash
docker run -d -p 27017:27017 --name mongo --rm mongo
```

This will run MongoDB in a docker container and expose it on port 27017. The connection string should them be `mongodb://127.0.0.1:27017`.

To stop the container, run `docker stop mongo`. This will also remove the container since we used the `--rm` flag.

package main

import (
	"errors"
	"net/http"

	"seahax.com/go/serve/app"
	"seahax.com/go/serve/handler"
	"seahax.com/go/serve/server"
)

func main() {
	options := app.LoadOptions()
	config := app.LoadConfig(options.ConfigFilename)
	server := server.NewServer(
		options.Addr,
		&config.Server,
		func(response *server.Response, request *http.Request) {
			defer handler.Log(response, request)()
			handler.Headers(&config.Headers, response, request)
			defer handler.Compress(&config.Compress, response, request)()
			handler.Serve(options.Root, response, request)
		},
	)

	if err := server.ListenAndServe(); !errors.Is(err, http.ErrServerClosed) {
		panic(err)
	}
}

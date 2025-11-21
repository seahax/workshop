package xhttp

import (
	"encoding/json"
	"log/slog"
	"net/http"
	"strconv"
)

// Write a status code with the default status text for the code.
func Error(w http.ResponseWriter, status int) {
	http.Error(w, http.StatusText(status), status)
}

// Write bytes to the response. Sets the Content-Length header. Uses the
// request logger to log any errors.
func WriteBytes(writer http.ResponseWriter, request *http.Request, bytes []byte) {
	header := writer.Header()
	header.Set("Content-Length", strconv.Itoa(len(bytes)))

	if _, err := writer.Write(bytes); err != nil {
		Logger(request).Error("error writing response", slog.String("error", err.Error()))
	}
}

// Write a string to the response. Sets the Content-Length header. Sets
// Content-Type to "text/plain" if not already set. Uses the request logger to
// log any errors.
func WriteText(writer http.ResponseWriter, request *http.Request, text string) {
	header := writer.Header()

	if header.Get("Content-Type") == "" {
		header.Set("Content-Type", "text/plain")
	}

	WriteBytes(writer, request, []byte(text))
}

// Marshal and write a value as JSON to the response. Sets the Content-Length
// header. Sets Content-Type to "application/json" if not already set. Uses the
// request logger to log any errors.
func WriteJSON(writer http.ResponseWriter, request *http.Request, value any) {
	bytes, err := json.Marshal(value)

	if err != nil {
		Logger(request).Error("error marshaling json response", slog.Any("error", err))
		return
	}

	header := writer.Header()

	if header.Get("Content-Type") == "" {
		header.Set("Content-Type", "application/json")
	}

	WriteBytes(writer, request, bytes)
}

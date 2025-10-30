package handler

import (
	"log/slog"
	"net/http"
	"time"

	"seahax.com/go/serve/server"
)

type LogConfig struct {
	Level  string
	Format string
}

func Log(response *server.Response, request *http.Request) func() {
	startTime := time.Now().UnixMilli()
	writeHeaderTime := startTime
	status := 0
	response.RegisterOnWriteHeader(func(newStatus int) {
		writeHeaderTime = time.Now().UnixMilli()
		status = newStatus
	})

	return func() {
		slog.LogAttrs(request.Context(), slog.LevelInfo, "incoming request",
			slog.String("url", request.URL.String()),
			slog.String("method", request.Method),
			slog.String("remote_addr", request.RemoteAddr),
			slog.String("referer", request.Referer()),
			slog.String("user_agent", request.UserAgent()),
			slog.String("proto", request.Proto),
			slog.Int("status", status),
			slog.String("content_type", response.Header().Get("Content-Type")),
			slog.Int64("response_time", writeHeaderTime-startTime),
			slog.Int64("total_time", time.Now().UnixMilli()-startTime),
		)
	}
}

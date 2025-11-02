package main

import (
	"compress/gzip"
	"crypto/tls"
	"errors"
	"flag"
	"fmt"
	"io"
	"log/slog"
	"net"
	"net/http"
	"os"
	"path"
	"slices"
	"strconv"
	"strings"
	"time"
)

func main() {
	addr := "127.0.0.1:8080"
	rootDir := "."
	origin := ""
	allowedOrigins := []string{}
	immutable := ""
	immutablePrefixes := []string{}
	noCompression := false
	logLevel := slog.LevelInfo
	logFormat := "text"

	fs := flag.NewFlagSet("serve", flag.ExitOnError)
	fs.StringVar(&addr, "addr", addr, "address to listen on")
	fs.StringVar(&rootDir, "root", rootDir, "root directory containing all served files")
	fs.StringVar(&origin, "cors-origins", origin, "Allowed CORS origins (CSV)")
	fs.StringVar(&immutable, "immutable", immutable, "Immutable path prefixes (CSV)")
	fs.BoolVar(&noCompression, "no-compression", noCompression, "Disable response compression")
	fs.TextVar(&logLevel, "log-level", logLevel, "log level (debug|info|warn|error)")
	fs.StringVar(&logFormat, "log-format", logFormat, "log format (text|json)")
	fs.Parse(os.Args[1:])

	compression := !noCompression

	if logFormat == "json" {
		slog.SetDefault(slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{Level: logLevel})))
	} else {
		slog.SetDefault(slog.New(slog.NewTextHandler(os.Stdout, &slog.HandlerOptions{Level: logLevel})))
	}

	slog.SetLogLoggerLevel(slog.LevelDebug)

	for allowedOrigin := range strings.SplitSeq(origin, ",") {
		allowedOrigin = strings.TrimSpace(allowedOrigin)

		if allowedOrigin != "" {
			allowedOrigins = append(allowedOrigins, allowedOrigin)
		}
	}

	for immutablePrefix := range strings.SplitSeq(immutable, ",") {
		immutablePrefix = strings.TrimSpace(immutablePrefix)
		trailingSlash := strings.HasSuffix(immutablePrefix, "/")

		if immutablePrefix != "" {
			immutablePrefix = path.Clean("/" + immutablePrefix)

			if trailingSlash {
				immutablePrefix += "/"
			}

			immutablePrefixes = append(immutablePrefixes, immutablePrefix)
		}
	}

	listener, err := net.Listen("tcp", addr)

	if err != nil {
		slog.Error("listener error", "error", err, "addr", addr)
		os.Exit(1)
	}

	defer listener.Close()
	slog.Info(fmt.Sprintf("server listening on http://%v", listener.Addr()))

	server := http.Server{
		ReadTimeout:  30 * time.Second,
		WriteTimeout: 5 * time.Minute,
		TLSNextProto: map[string]func(*http.Server, *tls.Conn, http.Handler){},
		ErrorLog:     slog.NewLogLogger(slog.Default().Handler(), slog.LevelError),
		Handler: http.HandlerFunc(func(resBase http.ResponseWriter, req *http.Request) {
			res := &Response{base: resBase, Writer: resBase}

			defer func() {
				for _, callback := range slices.Backward(res.OnClose) {
					if err := callback(); err != nil {
						slog.Error("error closing response", "error", err)
					}
				}
			}()

			log(res, req)
			headers(res, req, allowedOrigins, immutablePrefixes)

			if compression {
				compress(res, req)
			}

			serve(res, req, rootDir)
		}),
	}

	if err := server.Serve(listener); !errors.Is(err, http.ErrServerClosed) {
		slog.Error("server error", "error", err)
		os.Exit(1)
	}
}

type Response struct {
	base    http.ResponseWriter
	written bool

	Writer        io.Writer
	OnWriteHeader []func(int)
	OnClose       []func() error
}

func (w *Response) Header() http.Header {
	return w.base.Header()
}

func (w *Response) WriteHeader(statusCode int) {
	if !w.written {
		w.written = true

		for _, callback := range slices.Backward(w.OnWriteHeader) {
			callback(statusCode)
		}
	}

	w.base.WriteHeader(statusCode)
}

func (w *Response) Write(b []byte) (int, error) {
	if !w.written {
		w.WriteHeader(http.StatusOK)
	}

	return w.Writer.Write(b)
}

func log(res *Response, req *http.Request) {
	if !slog.Default().Enabled(req.Context(), slog.LevelInfo) {
		return
	}

	start := time.Now().UnixMilli()

	var status int
	var responseTime int64

	res.OnWriteHeader = append(res.OnWriteHeader, func(statusCode int) {
		status = statusCode
		responseTime = time.Now().UnixMilli() - start
	})

	res.OnClose = append(res.OnClose, func() error {
		slog.LogAttrs(req.Context(), slog.LevelInfo, "incoming request",
			slog.String("http_version", req.Proto),
			slog.String("method", req.Method),
			slog.String("url", req.URL.String()),
			slog.Int("status", status),
			slog.String("remote_addr", req.RemoteAddr),
			slog.String("referer", req.Referer()),
			slog.String("user_agent", req.UserAgent()),
			slog.Int64("response_time", responseTime),
			slog.Int64("total_time", time.Now().UnixMilli()-start),
		)
		return nil
	})
}

func headers(res *Response, req *http.Request, origins []string, immutablePrefixes []string) {
	res.Header().Set("Vary", "Origin, Accept-Encoding")

	isImmutable := slices.ContainsFunc(immutablePrefixes, func(immutablePrefix string) bool {
		return strings.HasPrefix(req.URL.Path, immutablePrefix)
	})

	if isImmutable {
		res.Header().Set("Cache-Control", "public, max-age=31536000, immutable")
	} else {
		res.Header().Set("Cache-Control", "no-cache")
	}

	if req.Header.Get("Origin") != "" {
		origin := req.Header.Get("Origin")
		isOriginAllowed := slices.ContainsFunc(origins, func(allowedOrigin string) bool {
			return allowedOrigin == "*" || allowedOrigin == origin
		})

		if isOriginAllowed {
			res.Header().Set("Access-Control-Allow-Origin", req.Header.Get("Origin"))
			res.Header().Set("Access-Control-Allow-Methods", "OPTIONS, GET, HEAD")
			res.Header().Set("Access-Control-Allow-Headers", "*")
			res.Header().Set("Access-Control-Expose-Headers", "*")
			res.Header().Set("Access-Control-Max-Age", "86400")
		}
	}
}

func compress(res *Response, req *http.Request) {
	if !strings.Contains(req.Header.Get("Accept-Encoding"), "gzip") {
		return
	}

	res.OnWriteHeader = append(res.OnWriteHeader, func(statusCode int) {
		if res.Header().Get("Content-Encoding") != "" {
			return
		}

		if contentType := res.Header().Get("Content-Type"); contentType != "" &&
			!strings.HasPrefix(contentType, "text/") &&
			!strings.HasPrefix(contentType, "application/") {
			return
		}

		if contentLength, err := strconv.Atoi(res.Header().Get("Content-Length")); err == nil && contentLength < 1024 {
			return
		}

		gzipWriter := gzip.NewWriter(res.Writer)
		res.Writer = gzipWriter
		res.OnClose = append(res.OnClose, gzipWriter.Close)

		res.Header().Set("Content-Encoding", "gzip")
		res.Header().Del("Content-Length")
	})
}

func serve(res *Response, req *http.Request, rootDir string) {
	if req.Method == http.MethodOptions {
		res.WriteHeader(http.StatusOK)
		return
	}

	if req.Method != http.MethodGet && req.Method != http.MethodHead {
		res.Header().Set("Allow", "GET, HEAD")
		res.WriteHeader(http.StatusMethodNotAllowed)
		return
	}

	if strings.HasSuffix(req.URL.Path, "/") {
		res.WriteHeader(http.StatusForbidden)
		return
	}

	fileName := path.Clean("/" + req.URL.Path)

	if fileName == "/" || strings.Contains(fileName, "/.") {
		res.WriteHeader(http.StatusForbidden)
		return
	}

	file, err := os.OpenInRoot(rootDir, fileName[1:])

	if err != nil {
		if errors.Is(err, os.ErrNotExist) {
			res.WriteHeader(http.StatusNotFound)
		} else if strings.Contains(err.Error(), "escape root directory") {
			res.WriteHeader(http.StatusForbidden)
		} else {
			res.WriteHeader(http.StatusInternalServerError)
			slog.Error("failed to open file", "error", err, "file", fileName)
		}

		return
	}

	defer file.Close()
	info, err := file.Stat()

	if err != nil {
		res.WriteHeader(http.StatusInternalServerError)
		slog.Error("failed to stat file", "error", err, "file", fileName)
		return
	}

	if info.IsDir() {
		res.WriteHeader(http.StatusForbidden)
		return
	}

	http.ServeContent(res, req, fileName, info.ModTime(), file)
}

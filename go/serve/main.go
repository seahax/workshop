package main

import (
	"compress/gzip"
	"encoding/json"
	"flag"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"os"
	"regexp"
	"strconv"
	"strings"
	"time"
)

func main() {
	slog.SetDefault(slog.New(slog.NewJSONHandler(os.Stdout, nil)))
	options := loadOptions()
	cacheConfig := loadCacheConfig(options.cacheConfigFilename)
	dir := http.Dir(options.dir)
	server := &http.Server{
		Addr: ":8080",
		Handler: http.HandlerFunc(func(baseResponse http.ResponseWriter, request *http.Request) {
			response := &response{base: baseResponse, writer: baseResponse}
			startTime := time.Now().UnixMilli()
			writeHeaderTime := startTime
			status := 0
			response.onWriteHeader = append(response.onWriteHeader, func(newStatus int) {
				writeHeaderTime = time.Now().UnixMilli()
				status = newStatus
			})

			defer func() {
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
			}()

			if request.Method != http.MethodGet {
				response.Header().Set("Allow", http.MethodGet)
				response.WriteHeader(http.StatusMethodNotAllowed)
				return
			}

			filename := request.URL.Path

			if !strings.HasPrefix(filename, "/") {
				filename = "/" + filename
			}

			if strings.HasSuffix(filename, "/") {
				response.WriteHeader(http.StatusNotFound)
				return
			}

			file, err := dir.Open(filename)

			if err != nil {
				response.WriteHeader(http.StatusNotFound)
				return
			}

			defer file.Close()
			fileInfo, err := file.Stat()

			if err != nil || fileInfo.IsDir() {
				response.WriteHeader(http.StatusNotFound)
				return
			}

			if strings.HasPrefix(request.Header.Get("Accept-Encoding"), "gzip") {
				var writer io.WriteCloser

				defer func() {
					if writer != nil {
						writer.Close()
					}
				}()

				response.onWriteHeader = append(response.onWriteHeader, func(_ int) {
					if isCompressible(response.Header()) {
						writer = gzip.NewWriter(response.writer)
						response.writer = writer
						response.Header().Set("Content-Encoding", "gzip")
						response.Header().Del("Content-Length")
					}
				})
			}

			cacheControl := cacheConfig.getCacheControl(filename)
			response.Header().Set("Cache-Control", cacheControl)
			response.Header().Set("Vary", "Accept-Encoding")
			http.ServeContent(response, request, filename, fileInfo.ModTime(), file)
		}),
	}

	if err := server.ListenAndServe(); err != nil {
		panic(err)
	}
}

//
// CLI
//

type options struct {
	dir                 string
	cacheConfigFilename string
}

func loadOptions() *options {
	var opts options
	fs := flag.NewFlagSet("", flag.ExitOnError)
	fs.StringVar(&opts.cacheConfigFilename, "cache-control", "", "path to a cache control config file (JSON)")
	fs.Usage = func() {
		fmt.Fprintln(os.Stderr, "Usage: serve <dir>")
		fmt.Fprintln(os.Stderr, "\nOptions:")
		fs.PrintDefaults()
	}
	fs.Parse(os.Args[1:])
	opts.dir = fs.Arg(0)

	if opts.dir == "" {
		optionsError(fs, "The <dir> argument is required.")
	}

	if len(fs.Args()) > 1 {
		optionsError(fs, "Too many arguments.")
	}

	return &opts
}

func optionsError(fs *flag.FlagSet, message string) {
	fs.Usage()
	fmt.Fprintln(os.Stderr, "")
	fmt.Fprintln(os.Stderr, message)
	os.Exit(1)
}

//
// Cache Config
//

type cacheConfig []func(string) string

func loadCacheConfig(filename string) cacheConfig {
	config := cacheConfig{}

	if filename == "" {
		return config
	}

	bytes, err := os.ReadFile(filename)

	if os.IsNotExist(err) {
		slog.Warn(fmt.Sprintf("Cache control config file not found: %s", filename))
		return config
	}

	if err != nil {
		slog.Warn(fmt.Sprintf("Error reading cache control config: %v", err))
		return config
	}

	var data map[string]string

	if err := json.Unmarshal(bytes, &data); err != nil {
		slog.Warn(fmt.Sprintf("Invalid cache control config: %v", err))
		return config
	}

	for pattern, value := range data {
		rx, err := regexp.Compile(pattern)

		if err != nil {
			slog.Warn(fmt.Sprintf("Invalid cache control regex %q: %v", pattern, err))
			continue
		}

		config = append(config, func(filename string) string {
			if rx.MatchString(filename) {
				return value
			}

			return ""
		})
	}

	return config
}

func (c cacheConfig) getCacheControl(filename string) string {
	for _, callback := range c {
		if value := callback(filename); value != "" {
			return value
		}
	}

	return "no-cache"
}

//
// Enhanced Response Writer
//

type response struct {
	base          http.ResponseWriter
	onWriteHeader []func(status int)
	written       bool
	writer        io.Writer
}

func (w *response) Header() http.Header {
	return w.base.Header()
}

func (w *response) WriteHeader(statusCode int) {
	if !w.written {
		w.written = true

		for _, callback := range w.onWriteHeader {
			callback(statusCode)
		}
	}

	w.base.WriteHeader(statusCode)
}

func (w *response) Write(b []byte) (int, error) {
	if !w.written {
		w.WriteHeader(http.StatusOK)
	}

	if w.writer == nil {
		return w.base.Write(b)
	}

	return w.writer.Write(b)
}

//
// Response Compresssion
//

func isCompressible(header http.Header) bool {
	contentType := header.Get("Content-Type")

	if contentType != "" && !strings.HasPrefix(contentType, "text/") && !strings.HasPrefix(contentType, "application/") {
		return false
	}

	length, err := strconv.Atoi(header.Get("Content-Length"))

	if err == nil && length < 1024 {
		return false
	}

	return true
}

package app

import (
	"encoding/json"
	"fmt"
	"log/slog"
	"os"
	"regexp"
	"strings"
	"time"

	"seahax.com/go/serve/handler"
	"seahax.com/go/serve/server"
)

type Config struct {
	Server   server.ServerConfig
	Compress handler.CompressConfig
	Headers  handler.HeadersConfig
}

type configJson struct {
	Log struct {
		Level  string `json:"level"`
		Format string `json:"format"`
	} `json:"log"`
	Server struct {
		ReadTimeout  string `json:"readTimeout"`
		WriteTimeout string `json:"writeTimeout"`
	} `json:"server"`
	Compress struct {
		MinBytes  int      `json:"minBytes"`
		MimeTypes []string `json:"mimeTypes"`
	} `json:"compress"`
	Headers      map[string]string `json:"headers"`
	CacheControl map[string]string `json:"cacheControl"`
	Cors         struct {
		Origins       []string `json:"origins"`
		Methods       []string `json:"methods"`
		Headers       []string `json:"headers"`
		ExposeHeaders []string `json:"exposeHeaders"`
	}
}

func LoadConfig(filename string) *Config {
	config := &Config{}
	config.Server.Addr = ":8080"
	config.Server.ReadTimeout = 30 * time.Second
	config.Server.WriteTimeout = 3 * time.Minute
	config.Compress.MinBytes = 1024
	config.Compress.MimeTypes = []string{"text/*", "application/*"}
	config.Headers.Headers = map[string]string{}

	if filename == "" {
		return config
	}

	file, err := os.Open(filename)

	if os.IsNotExist(err) {
		fmt.Fprintf(os.Stderr, "config file not found: %s\n", filename)
		os.Exit(1)
	}

	if err != nil {
		fmt.Fprintf(os.Stderr, "error reading config: %v\n", err)
		os.Exit(1)
	}

	defer file.Close()

	decoder := json.NewDecoder(file)
	decoder.DisallowUnknownFields()
	configJson := &configJson{}

	if err := decoder.Decode(configJson); err != nil {
		fmt.Fprintf(os.Stderr, "invalid config: %v\n", err)
		os.Exit(1)
	}

	if configJson.Server.ReadTimeout != "" {
		if readTimeout, err := time.ParseDuration(configJson.Server.ReadTimeout); err != nil {
			fmt.Fprintf(os.Stderr, "invalid read timeout: %v\n", err)
			os.Exit(1)
		} else {
			config.Server.ReadTimeout = readTimeout
		}
	}

	if configJson.Server.WriteTimeout != "" {
		if writeTimeout, err := time.ParseDuration(configJson.Server.WriteTimeout); err != nil {
			fmt.Fprintf(os.Stderr, "invalid write timeout: %v\n", err)
			os.Exit(1)
		} else {
			config.Server.WriteTimeout = writeTimeout
		}
	}

	if configJson.Cors.Origins != nil {
		config.Headers.Cors.Origins = configJson.Cors.Origins
		config.Headers.Cors.Methods = configJson.Cors.Methods
		config.Headers.Cors.Headers = configJson.Cors.Headers
		config.Headers.Cors.ExposeHeaders = configJson.Cors.ExposeHeaders
	}

	if configJson.Compress.MinBytes != 0 {
		config.Compress.MinBytes = configJson.Compress.MinBytes
	}

	if len(configJson.Compress.MimeTypes) > 0 {
		config.Compress.MimeTypes = configJson.Compress.MimeTypes
	}

	if configJson.Headers != nil {
		config.Headers.Headers = configJson.Headers
	}

	if configJson.CacheControl != nil {
		for pattern, value := range configJson.CacheControl {
			rx, err := regexp.Compile(pattern)

			if err != nil {
				fmt.Fprintf(os.Stderr, "invalid cache control regex %q: %v\n", pattern, err)
				os.Exit(1)
			}

			config.Headers.CacheControl = append(config.Headers.CacheControl, func(filename string) string {
				if rx.MatchString(filename) {
					return value
				}

				return ""
			})
		}
	}

	configJson.Log.Level = strings.ToLower(configJson.Log.Level)
	configJson.Log.Format = strings.ToLower(configJson.Log.Format)

	if configJson.Log.Level == "" {
		configJson.Log.Level = "info"
	}

	if configJson.Log.Format == "" {
		configJson.Log.Format = "text"
	}

	if configJson.Log.Level == "none" {
		slog.SetDefault(slog.New(slog.DiscardHandler))
	} else {
		var logLevel slog.Level

		if err := logLevel.UnmarshalText([]byte(configJson.Log.Level)); err != nil {
			fmt.Fprintf(os.Stderr, "invalid log level: %s\n", configJson.Log.Level)
			os.Exit(1)
		}

		switch configJson.Log.Format {
		case "json":
			slog.SetDefault(slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
				Level: logLevel,
			})))
		case "text":
			slog.SetDefault(slog.New(slog.NewTextHandler(os.Stdout, &slog.HandlerOptions{
				Level: logLevel,
			})))
		default:
			fmt.Fprintf(os.Stderr, "invalid log format: %s\n", configJson.Log.Format)
			os.Exit(1)
		}
	}

	return config
}

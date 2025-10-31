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

// Config loaded from a JSON configuration file.
type Config struct {
	Server   server.ServerConfig
	Compress handler.CompressConfig
	Headers  handler.HeadersConfig
}

// Raw JSON shape of the configuration file.
type ConfigJson struct {
	// Not used. Just for documentation.
	Comments any `json:"_"`

	Log struct {
		Level  slog.Level `json:"level"`
		Format *string    `json:"format"`
	} `json:"log"`
	Server struct {
		ReadTimeout  *string `json:"readTimeout"`
		WriteTimeout *string `json:"writeTimeout"`
	} `json:"server"`
	Compress struct {
		MinBytes  *int     `json:"minBytes"`
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

// Load Config from a JSON file.
func LoadConfig(filename string) *Config {
	config := &Config{}
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
		fmt.Fprintf(os.Stderr, "error reading config file: %v\n", err)
		os.Exit(1)
	}

	defer file.Close()

	decoder := json.NewDecoder(file)
	decoder.DisallowUnknownFields()
	configJson := &ConfigJson{}

	if err := decoder.Decode(configJson); err != nil {
		invalidConfig(err)
	}

	if configJson.Server.ReadTimeout != nil {
		config.Server.ReadTimeout = parseDuration("read timeout", *configJson.Server.ReadTimeout)
	}

	if configJson.Server.WriteTimeout != nil {
		config.Server.WriteTimeout = parseDuration("write timeout", *configJson.Server.WriteTimeout)
	}

	config.Headers.Cors.Origins = configJson.Cors.Origins
	config.Headers.Cors.Methods = configJson.Cors.Methods
	config.Headers.Cors.Headers = configJson.Cors.Headers
	config.Headers.Cors.ExposeHeaders = configJson.Cors.ExposeHeaders

	if configJson.Compress.MinBytes != nil {
		config.Compress.MinBytes = *configJson.Compress.MinBytes
	}

	if configJson.Compress.MimeTypes != nil {
		config.Compress.MimeTypes = configJson.Compress.MimeTypes
	}

	if configJson.Headers != nil {
		config.Headers.Headers = configJson.Headers
	}

	if configJson.CacheControl != nil {
		config.Headers.CacheControl = parseCacheControl(configJson.CacheControl)
	}

	setupLogging(configJson.Log.Format, configJson.Log.Level)

	v, _ := json.MarshalIndent(config, "", "  ")
	fmt.Println(string(v))

	return config
}

func setupLogging(formatPtr *string, level slog.Level) {
	format := "text"

	if formatPtr != nil {
		format = *formatPtr
	}

	switch strings.ToLower(format) {
	case "json":
		slog.SetDefault(slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
			Level: level,
		})))
	case "text":
		slog.SetDefault(slog.New(slog.NewTextHandler(os.Stdout, &slog.HandlerOptions{
			Level: level,
		})))
	default:
		invalidConfig(fmt.Errorf("invalid log format: %s", format))
	}
}

func parseDuration(name string, value string) time.Duration {
	duration, err := time.ParseDuration(value)
	if err != nil {
		invalidConfig(fmt.Errorf("invalid %s duration: %w", name, err))
	}
	return duration
}

func parseCacheControl(cacheControl map[string]string) []*handler.CacheControlConfig {
	var configs []*handler.CacheControlConfig

	for pattern, value := range cacheControl {
		rx, err := regexp.Compile(pattern)

		if err != nil {
			invalidConfig(fmt.Errorf("invalid cache control pattern %q: %w", pattern, err))
		}

		configs = append(configs, &handler.CacheControlConfig{
			Pattern: rx,
			Value:   value,
		})
	}

	return configs
}

func invalidConfig(err error) {
	fmt.Fprintf(os.Stderr, "invalid config: %v\n", err)
	os.Exit(1)
}

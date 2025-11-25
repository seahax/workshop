package config

import (
	"log/slog"
	"net/url"
	"time"

	"seahax.com/go/env"
	"seahax.com/go/shorthand"
)

func GetEnv[T any](name string, tags ...string) T {
	return shorthand.CriticalValue(env.Get[T](name,
		env.OptionPrefix("APP_"),
		env.OptionValidate(tags...),
	))
}

var StartTimestamp = time.Now().UnixMilli()
var BuildTimestamp = GetEnv[int64]("BUILD_TIMESTAMP")
var Commit = GetEnv[string]("COMMIT")
var Environment = GetEnv[string]("ENVIRONMENT", "oneof=development production")
var Address = GetEnv[string]("ADDRESS")
var Origin = GetEnv[string]("ORIGIN", "url")
var OriginScheme = shorthand.CriticalValue(url.Parse(Origin)).Scheme
var OriginHost = shorthand.CriticalValue(url.Parse(Origin)).Host
var StaticPath = GetEnv[string]("STATIC_PATH", "dir")
var LogLevel = GetEnv[slog.Level]("LOG_LEVEL")
var LogFormat = shorthand.Coalesce(GetEnv[string]("LOG_FORMAT", "omitempty", "oneof=text json"), "text")
var SentryDSN = GetEnv[string]("SENTRY_DSN", "omitempty", "url")
var MongoURI = GetEnv[string]("MONGODB_URL", "url")

package config

import (
	"log/slog"
	"time"

	"seahax.com/go/env"
	"seahax.com/go/shorthand"
)

func Get[T any](name string, tags ...string) T {
	return shorthand.CriticalValue(env.Get[T](name,
		env.OptionPrefix("APP_"),
		env.OptionValidate(tags...),
	))
}

var StartTimestamp = time.Now().UnixMilli()
var BuildTimestamp = Get[int64]("BUILD_TIMESTAMP")
var Commit = Get[string]("COMMIT")
var Environment = Get[string]("ENVIRONMENT", "oneof=development production")
var Address = Get[string]("ADDRESS")
var Origin = Get[string]("ORIGIN", "url")
var StaticPath = Get[string]("STATIC_PATH", "dir")
var LogLevel = Get[slog.Level]("LOG_LEVEL")
var LogFormat = shorthand.Coalesce(Get[string]("LOG_FORMAT", "omitempty", "oneof=text json"), "text")
var SentryDSN = Get[string]("SENTRY_DSN", "omitempty", "url")
var MongoURI = Get[string]("MONGODB_URL", "url")

package config

import (
	"log/slog"
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
var StaticPath = GetEnv[string]("STATIC_PATH", "dir")
var LogLevel = GetEnv[slog.Level]("LOG_LEVEL")
var LogFormat = shorthand.Coalesce(GetEnv[string]("LOG_FORMAT", "omitempty", "oneof=text json"), "text")
var SentryDSN = GetEnv[string]("SENTRY_DSN", "omitempty", "url")
var MongoURI = GetEnv[string]("MONGODB_URL", "url")
var SmtpServer = GetEnv[string]("SMTP_SERVER", "hostname")
var SmtpPort = GetEnv[uint]("SMTP_PORT", "port")
var SmtpUsername = GetEnv[string]("SMTP_USERNAME", "email")
var SmtpToken = GetEnv[string]("SMTP_TOKEN", "required")

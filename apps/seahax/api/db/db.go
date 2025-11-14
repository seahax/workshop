package db

import (
	"context"
	"log/slog"
	"seahax/api/config"
	"sync"
	"time"

	"go.mongodb.org/mongo-driver/v2/mongo"
	"go.mongodb.org/mongo-driver/v2/mongo/options"
	"go.mongodb.org/mongo-driver/v2/mongo/readpref"
	"seahax.com/go/api/health"
)

var Get = sync.OnceValue(func() *mongo.Client {
	serverApiOptions := options.
		ServerAPI(options.ServerAPIVersion1)
	clientOptions := options.Client().
		ApplyURI(config.Get().MongoURI).
		SetServerAPIOptions(serverApiOptions)

	client, err := mongo.Connect(nil, clientOptions)

	if err != nil {
		panic(err)
	}

	return client
})

func Health() *health.Ticker {
	ticker := health.NewTicker(30*time.Second, func() health.Status {
		slog.Debug("pinging mongodb")

		db := Get()
		ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
		defer cancel()

		if err := db.Ping(ctx, readpref.Primary()); err != nil {
			slog.Error("mongodb ping failed", "error", err)
			return health.StatusUnhealthy
		}

		return health.StatusHealthy
	})

	ticker.Tick()

	return ticker
}

package db

import (
	"context"
	"log/slog"
	"seahax/api/internal/config"
	"time"

	"go.mongodb.org/mongo-driver/v2/mongo"
	"go.mongodb.org/mongo-driver/v2/mongo/options"
	"go.mongodb.org/mongo-driver/v2/mongo/readpref"
	"seahax.com/go/shorthand"
	"seahax.com/go/xhttp/controller/xhealth"
)

var MongoDB *mongo.Client
var MongoDBHealth *xhealth.Monitor

func init() {
	serverOptions := options.ServerAPI(options.ServerAPIVersion1)
	clientOptions := options.Client().ApplyURI(config.MongoURI).SetServerAPIOptions(serverOptions)
	client := shorthand.CriticalValue(mongo.Connect(nil, clientOptions))
	monitor := xhealth.NewMonitor(30*time.Second, func() bool {
		slog.Debug("pinging mongodb")

		ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
		defer cancel()

		if err := MongoDB.Ping(ctx, readpref.Primary()); err != nil {
			slog.Error("failed pinging mongodb", "error", err)
			return false
		}

		slog.Debug("succeeded pinging mongodb")
		return true
	})

	MongoDB = client
	MongoDBHealth = monitor
}

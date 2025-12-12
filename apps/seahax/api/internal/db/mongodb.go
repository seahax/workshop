package db

import (
	"seahax/api/internal/config"

	"go.mongodb.org/mongo-driver/v2/mongo"
	"go.mongodb.org/mongo-driver/v2/mongo/options"
	"seahax.com/go/shorthand"
)

var Client *mongo.Client

func init() {
	serverOptions := options.ServerAPI(options.ServerAPIVersion1)
	clientOptions := options.Client().ApplyURI(config.MongoURI).SetServerAPIOptions(serverOptions)
	Client = shorthand.CriticalValue(mongo.Connect(nil, clientOptions))
}

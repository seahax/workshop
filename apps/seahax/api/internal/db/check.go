package db

import (
	"context"
	"fmt"
	"log/slog"
	"time"

	"go.mongodb.org/mongo-driver/v2/mongo/readpref"
)

func Check() error {
	slog.Debug("pinging mongodb")

	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()

	if err := Client.Ping(ctx, readpref.Primary()); err != nil {
		return fmt.Errorf("failed pinging mongodb: %w", err)
	}

	slog.Debug("succeeded pinging mongodb")
	return nil
}

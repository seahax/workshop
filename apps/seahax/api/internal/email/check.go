package email

import (
	"context"
	"fmt"
	"log/slog"
)

// Panics if unable to dial the SMTP server.
func Check() error {
	slog.Debug("dialing SMTP")
	client, err := newClient()

	if err != nil {
		return fmt.Errorf("failed to create SMTP client: %w", err)
	}

	defer client.Close()

	err = retry.Do(func() error {
		return client.DialWithContext(context.Background())
	})

	if err != nil {
		return fmt.Errorf("failed dialing SMTP: %w", err)
	}

	slog.Debug("succeeded dialing SMTP")
	return nil
}

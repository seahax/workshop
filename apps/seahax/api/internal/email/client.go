package email

import (
	"context"
	"log/slog"
	"seahax/api/internal/config"
	"time"

	"github.com/wneessen/go-mail"
	"seahax.com/go/xhttp/controller/xhealth"
)

func NewClient() (*mail.Client, error) {
	return mail.NewClient(config.SmtpServer,
		mail.WithPort(int(config.SmtpPort)),
		mail.WithSMTPAuth(mail.SMTPAuthPlain),
		mail.WithUsername(config.SmtpUsername),
		mail.WithPassword(config.SmtpToken),
	)
}

var Health *xhealth.Monitor

func init() {
	Health = xhealth.NewMonitor(5*time.Minute, func() bool {
		slog.Debug("dialing SMTP")
		client, err := NewClient()

		if err != nil {
			slog.Error("failed to create SMTP client", "error", err)
			return false
		}

		defer client.Close()

		if err := client.DialWithContext(context.Background()); err != nil {
			slog.Error("failed dialing SMTP", "error", err)
			return false
		}

		slog.Debug("succeeded dialing SMTP")
		return true
	})
}

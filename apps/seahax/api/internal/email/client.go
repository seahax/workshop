package email

import (
	"seahax/api/internal/config"

	"github.com/wneessen/go-mail"
)

func newClient() (*mail.Client, error) {
	return mail.NewClient(config.SmtpServer,
		mail.WithPort(int(config.SmtpPort)),
		mail.WithSMTPAuth(mail.SMTPAuthPlain),
		mail.WithUsername(config.SmtpUsername),
		mail.WithPassword(config.SmtpToken),
	)
}

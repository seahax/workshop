package email

import (
	"seahax/api/internal/config"

	"github.com/wneessen/go-mail"
)

func Send(to string, subject string, body Body) error {
	msg := mail.NewMsg()

	if err := msg.From(config.SmtpUsername); err != nil {
		return err
	}

	if err := msg.To(to); err != nil {
		return err
	}

	msg.Subject(subject)

	if body.Text != "" {
		msg.SetBodyString(mail.TypeTextPlain, body.Text)
	}

	if body.Html != "" {
		msg.SetBodyString(mail.TypeTextHTML, body.Html)
	}

	client, err := NewClient()

	if err != nil {
		return err
	}

	if err := client.DialAndSend(msg); err != nil {
		return err
	}

	return nil
}

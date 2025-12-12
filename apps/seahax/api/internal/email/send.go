package email

import (
	"seahax/api/internal/config"

	"github.com/wneessen/go-mail"
)

type Body struct {
	Text string
	Html string
}

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

	client, err := newClient()

	if err != nil {
		return err
	}

	return retry.Do(func() error {
		return client.DialAndSend(msg)
	})
}

package email

import (
	"time"

	"seahax.com/go/shorthand"
)

var retry = shorthand.Retry{
	Count:   3,
	Backoff: shorthand.NewExponentialBackoff(5 * time.Second).WithJitter(),
}

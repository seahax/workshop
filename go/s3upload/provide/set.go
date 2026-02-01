package provide

// [Content] that is a collection of other [Content] items.
type Set []Content

// Implements the [Content.PublishTo] method.
func (s Set) PublishTo(publisher ContentPublisher) error {
	for _, content := range s {
		if err := content.PublishTo(publisher); err != nil {
			return err
		}
	}

	return nil
}

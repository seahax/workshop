package command

import "strings"

// Help string builder.
type HelperBuilder struct {
	ub      strings.Builder
	b       strings.Builder
	section string
	heading string
}

// Create a new [HelperBuilder].
func NewHelperBuilder() HelperBuilder {
	return HelperBuilder{}
}

// Write a usage line.
func (h *HelperBuilder) WriteUsage(s string) {
	if s == "" {
		return
	}

	h.ub.WriteString(s)
	h.ub.WriteString("\n")
}

// Write a paragraph.
func (h *HelperBuilder) WriteParagraph(s string) {
	if s == "" {
		return
	}

	h.section = "paragraph"

	if h.b.Len() > 0 {
		h.b.WriteString("\n")
	}

	h.b.WriteString(s)
	h.b.WriteString("\n")
}

// Write a list heading. Deferred until at least one list item is written.
func (h *HelperBuilder) WriteListHeading(s string) {
	if s == "" {
		return
	}

	h.section = "list"
	h.heading = s
}

// Write a list item.
func (h *HelperBuilder) WriteListItem(key string, s string) {
	if key == "" || s == "" {
		return
	}

	if h.b.Len() > 0 && (h.section != "list" || h.heading != "") {
		h.b.WriteString("\n")
	}

	if h.heading != "" {
		h.b.WriteString(h.heading)
		h.b.WriteString("\n")
	}

	h.section = "list"
	h.heading = ""
	h.b.WriteString("  ")
	h.b.WriteString(key)

	if len(key) <= 2 {
		h.b.WriteString(strings.Repeat(" ", 4-len(key)))
	} else {
		h.b.WriteString("\n      ")
	}

	h.b.WriteString(strings.ReplaceAll(s, "\n", "\n      "))
	h.b.WriteString("\n")
}

// Get the result and reset the builder.
func (h *HelperBuilder) String() string {
	if h.ub.Len() > 0 && h.b.Len() > 0 {
		h.ub.WriteString("\n")
	}

	h.ub.WriteString(h.b.String())
	str := h.ub.String()
	h.ub.Reset()
	h.b.Reset()
	h.section = ""
	h.heading = ""
	return str
}

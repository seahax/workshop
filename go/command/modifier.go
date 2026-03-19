package command

type Modifier interface {
	Modify(command CommandMutable)
}

type Modify func(command CommandMutable)

func (m Modify) Modify(command CommandMutable) {
	m(command)
}

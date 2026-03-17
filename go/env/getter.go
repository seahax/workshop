package env

type Getter interface {
	Get(name string) (value string, ok bool)
}

// Environment variable lookup function.
type Get func(name string) (value string, ok bool)

func (g Get) Get(name string) (value string, ok bool) {
	return g(name)
}

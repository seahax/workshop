package info

import "seahax.com/go/api"

type Route struct {
	Commit         string `json:"commit"`
	BuildTimestamp int64  `json:"buildTimestamp"`
	StartTimestamp int64  `json:"startTimestamp"`
	Environment    string `json:"environment"`
}

func (i *Route) GetRoute() *api.Route {
	return &api.Route{
		Pattern: "GET /_info",
		Handler: func(ctx *api.Context) {
			ctx.Response.Header().Set("Cache-Control", "no-cache")
			ctx.Response.WriteJSON(i)
		},
	}
}

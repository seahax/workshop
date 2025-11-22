package xhttp

import (
	"net/http"

	"seahax.com/go/shorthand"
)

// Create a new [net/http.HandlerFunc] from controllers.
func NewHandler(controllers ...*Controller) http.HandlerFunc {
	mux := http.NewServeMux()

	for _, controller := range controllers {
		routes := buildRoutes(controller)

		for _, route := range routes {
			mux.HandleFunc(route.Pattern, route.Handler)
		}
	}

	return mux.ServeHTTP
}

func buildRoutes(controller *Controller) []*Route {
	routes := make([]*Route, 0, len(controller.Routes))

	for _, route := range controller.Routes {
		p := ParsePattern(route.Pattern)
		p.Path = PatternPathJoin(controller.Prefix, p.Path)
		p.Domain = shorthand.Coalesce(p.Domain, controller.Domain)

		routes = append(routes, &Route{
			Pattern: p.String(),
			Handler: WithMiddleware(route.Handler, controller.Middlewares...),
		})
	}

	return routes
}

data "digitalocean_project" "self" {
  name = "seahax"
}

resource "digitalocean_app" "self" {
  project_id = data.digitalocean_project.self.id

  spec {
    name   = "app"
    region = "sfo"

    # service {
    #   name               = "api"
    #   instance_count     = 1
    #   instance_size_slug = "basic-xxs"

    #   git {
    #     repo_clone_url = "https://github.com/digitalocean/sample-golang.git"
    #     branch         = "main"
    #   }
    # }

    static_site {
      name              = "frontend"
      build_command     = "pnpm install --frozen-lockfile && pnpm build"
      output_dir        = "apps/do-demo/frontend/dist"
      index_document    = "index.html"
      catchall_document = "index.html"
      github {
        repo           = "seahax/workshop"
        branch         = "digitalocean"
        deploy_on_push = true
      }
    }

    ingress {
      # rule {
      #   component {
      #     name = "api"
      #   }

      #   match {
      #     path {
      #       prefix = "/api"
      #     }
      #   }
      # }

      rule {
        component {
          name = "frontend"
        }

        match {
          path {
            prefix = "/"
          }
        }
      }
    }
  }
}

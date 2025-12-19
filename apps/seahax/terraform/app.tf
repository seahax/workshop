resource "digitalocean_app" "self" {
  project_id = data.digitalocean_project.self.id

  spec {
    name = "seahax"
    region = "sfo"

    service {
      name = "app"
      http_port = 8080
      instance_count = 1
      instance_size_slug = "apps-s-1vcpu-0.5gb"

      image {
        registry_type = "GHCR"
        registry_credentials = "seahax:${var.ghcr_token}"
        registry = "seahax"
        repository = "app"
        tag = "latest"
      }

      env {
        key = "APP_ENVIRONMENT"
        scope = "RUN_TIME"
        value = local.environment
      }

      env {
        key = "APP_MONGODB_URL"
        scope = "RUN_TIME"
        value = "$${db.DATABASE_URL}"
      }

      env {
        key = "APP_CACHE_URL"
        scope = "RUN_TIME"
        value = "$${cache.REDIS_URL}"
      }

      env {
        key = "APP_SENTRY_DSN"
        scope = "RUN_TIME"
        value = local.sentry_dsn
      }

      env {
        key = "APP_SMTP_SERVER"
        scope = "RUN_TIME"
        value = local.smtp_server
      }

      env {
        key = "APP_SMTP_PORT"
        scope = "RUN_TIME"
        value = tostring(local.smtp_port)
      }

      env {
        key = "APP_SMTP_USERNAME"
        scope = "RUN_TIME"
        value = local.smtp_username
      }

      env {
        key = "APP_SMTP_TOKEN"
        scope = "RUN_TIME"
        value = var.smtp_token
        type = "SECRET"
      }

      health_check {
        http_path = "/_health"
        initial_delay_seconds = 15
        period_seconds = 30
        timeout_seconds = 3
        success_threshold = 1
        failure_threshold = 3
      }
    }

    ingress {
      rule {
        component {
          name = "app"
        }
        match {
          path {
            prefix = "/"
          }
        }
      }
    }

    domain {
      name = "seahax.com"
      type = "PRIMARY"
    }

    domain {
      name = "www.seahax.com"
      type = "ALIAS"
    }

    database {
      name = "db"
      cluster_name = digitalocean_database_cluster.mongodb.name
      engine = upper(digitalocean_database_cluster.mongodb.engine)
      version = digitalocean_database_cluster.mongodb.version
      production = true
    }

    database {
      name = "cache"
      cluster_name = digitalocean_database_cluster.valkey.name
      engine = upper(digitalocean_database_cluster.valkey.engine)
      version = digitalocean_database_cluster.valkey.version
      production = true
    }

    alert { rule = "DEPLOYMENT_FAILED" }
    alert { rule = "DOMAIN_FAILED" }
  }
}
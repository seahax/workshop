resource "digitalocean_database_cluster" "mongodb" {
  project_id = data.digitalocean_project.self.id
  name       = "seahax-mongodb"
  engine     = "mongodb"
  version    = "8"
  size       = "db-s-1vcpu-1gb"
  region     = "sfo3"
  node_count = 1
}

resource "digitalocean_database_firewall" "mongodb" {
  cluster_id = digitalocean_database_cluster.mongodb.id

  rule {
    type  = "app"
    value = digitalocean_app.self.id
  }
}

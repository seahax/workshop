resource "digitalocean_database_cluster" "valkey" {
  project_id = data.digitalocean_project.self.id
  name       = "seahax-valkey"
  engine     = "valkey"
  version    = "8"
  size       = "db-s-1vcpu-1gb"
  region     = "sfo3"
  node_count = 1
  eviction_policy = "allkeys_lru"
}

resource "digitalocean_database_firewall" "valkey" {
  cluster_id = digitalocean_database_cluster.valkey.id

  rule {
    type  = "app"
    value = digitalocean_app.self.id
  }
}

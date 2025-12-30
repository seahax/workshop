resource "digitalocean_spaces_bucket" "bucket" {
  name   = "seahax-content"
  region = "sfo3"
}

resource "digitalocean_spaces_key" "bucket-read" {
  name = "seahax-content-read"
  grant {
    bucket     = digitalocean_spaces_bucket.bucket.name
    permission = "read"
  }
}

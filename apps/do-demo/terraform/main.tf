terraform {
  cloud {
    organization = "seahax"

    workspaces {
      tags = ["seahax"]
    }
  }

  required_providers {
    digitalocean = {
      source  = "digitalocean/digitalocean"
      version = "2.43.0"
    }
  }
}

variable "do_token" {
  type      = string
  sensitive = true
}

provider "digitalocean" {
  token = var.do_token
}

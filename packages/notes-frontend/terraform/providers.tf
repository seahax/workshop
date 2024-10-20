provider "aws" {
  region              = "us-east-2"
  profile             = "seahax"
  allowed_account_ids = ["194722422414"]
}

provider "aws" {
  alias               = "global"
  region              = "us-east-1"
  profile             = "seahax"
  allowed_account_ids = ["194722422414"]
}

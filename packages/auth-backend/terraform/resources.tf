module "function" {
  source = "../../terraform/lambda"

  name = "auth-backend"
  zip  = "../dist/bundle.zip"

  trigger_api_gateway_enabled = true
}

module "key" {
  source = "../../terraform/secret-password"

  name_prefix = "auth-backend-key-"
}

module "api" {
  source = "../../terraform/api-gateway-http"

  name = "auth-backend"
  routes = {
    "$default" = {
      invoke_arn = module.function.invoke_arn
    }
  }
}

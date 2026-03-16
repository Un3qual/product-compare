defmodule ProductCompareWeb.AuthController do
  use ProductCompareWeb, :controller

  # All browser-facing auth operations have been migrated to GraphQL mutations.
  # See lib/product_compare_web/schema.ex and lib/product_compare_web/resolvers/auth_resolver.ex
  # for the GraphQL auth implementation (login, register, logout).
  #
  # Future REST endpoints for forgot_password, reset_password, and verify_email
  # should also be implemented as GraphQL mutations following the same pattern.
end
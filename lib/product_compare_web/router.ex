defmodule ProductCompareWeb.Router do
  use ProductCompareWeb, :router

  pipeline :api do
    plug :accepts, ["json"]
  end

  pipeline :api_session do
    plug :fetch_session
    plug ProductCompareWeb.Plugs.FetchCurrentUser
  end

  pipeline :graphql_api do
    plug ProductCompareWeb.Plugs.EnforceNoStoreGraphqlCache
    plug ProductCompareWeb.Plugs.AuthenticateApiToken
    plug ProductCompareWeb.Plugs.PutAbsintheContext
  end

  scope "/api/auth", ProductCompareWeb do
    pipe_through [:api, :api_session]

    post "/register", AuthController, :register
    post "/login", SessionController, :create
    delete "/logout", SessionController, :delete
    post "/forgot-password", AuthController, :forgot_password
    post "/reset-password", AuthController, :reset_password
    post "/verify-email", AuthController, :verify_email
  end

  scope "/api" do
    pipe_through [:api, :api_session, :graphql_api]

    forward "/graphql", Absinthe.Plug, schema: ProductCompareWeb.Schema
  end
end

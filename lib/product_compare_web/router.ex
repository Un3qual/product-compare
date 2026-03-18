defmodule ProductCompareWeb.Router do
  use ProductCompareWeb, :router

  pipeline :api_cors do
    plug ProductCompareWeb.Plugs.AllowTrustedOrigins
  end

  pipeline :api do
    plug :accepts, ["json"]
  end

  pipeline :api_session do
    plug :fetch_session
    plug ProductCompareWeb.Plugs.FetchCurrentUser
  end

  pipeline :graphql_session do
    plug :fetch_session
    plug ProductCompareWeb.Plugs.FetchCurrentUser, same_origin_only: true
  end

  pipeline :same_origin_session_boundary do
    plug ProductCompareWeb.Plugs.RequireSameOrigin
  end

  pipeline :graphql_api do
    plug ProductCompareWeb.Plugs.EnforceNoStoreGraphqlCache
    plug ProductCompareWeb.Plugs.AuthenticateApiToken
    plug ProductCompareWeb.Plugs.PutAbsintheContext
    plug ProductCompareWeb.Plugs.ApplyGraphqlSessionMutations
  end

  scope "/api", ProductCompareWeb do
    pipe_through [:api_cors]

    options "/*path", PreflightController, :options
  end

  scope "/api" do
    pipe_through [:api_cors, :api, :graphql_session, :graphql_api]

    forward "/graphql", Absinthe.Plug, schema: ProductCompareWeb.Schema
    forward "/graphiql", Absinthe.Plug.GraphiQL, schema: ProductCompareWeb.Schema, interface: :simple
  end
end

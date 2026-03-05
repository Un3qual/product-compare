defmodule ProductCompareWeb.Router do
  use ProductCompareWeb, :router

  pipeline :api do
    plug :accepts, ["json"]
  end

  pipeline :graphql_api do
    plug ProductCompareWeb.Plugs.AuthenticateApiToken
    plug ProductCompareWeb.Plugs.PutAbsintheContext
  end

  scope "/api" do
    pipe_through [:api, :graphql_api]

    forward "/graphql", Absinthe.Plug, schema: ProductCompareWeb.Schema
  end
end

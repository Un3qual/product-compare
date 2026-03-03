defmodule ProductCompareWeb.Router do
  use ProductCompareWeb, :router

  pipeline :api do
    plug :accepts, ["json"]
  end

  scope "/api", ProductCompareWeb do
    pipe_through :api
  end
end

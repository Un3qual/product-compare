defmodule ProductCompare.Repo do
  use Ecto.Repo,
    otp_app: :product_compare,
    adapter: Ecto.Adapters.Postgres
end

defmodule ProductCompare.CommerceAttribution.Conversions.PurchaseFacts do
  @moduledoc false

  alias ProductCompare.Repo
  alias ProductCompareSchemas.CommerceAttribution.PurchasePriceFact

  @spec create(map()) :: {:ok, PurchasePriceFact.t()} | {:error, Ecto.Changeset.t()}
  def create(attrs) do
    %PurchasePriceFact{}
    |> PurchasePriceFact.changeset(attrs)
    |> Repo.insert()
  end
end

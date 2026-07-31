defmodule ProductCompare.ComparisonSnapshots do
  @moduledoc """
  Publishes immutable, public-safe comparison fact records and revokes their
  opaque public links without mutating captured facts.
  """

  alias ProductCompare.ComparisonSnapshots.Lifecycle
  alias ProductCompareSchemas.Catalog.ComparisonSnapshot

  @spec publish(pos_integer(), map(), keyword()) ::
          {:ok, ComparisonSnapshot.t()}
          | {:error,
             :invalid_products | :product_not_found | :invalid_profile | Ecto.Changeset.t()}
  def publish(user_id, attrs, opts \\ []) when is_integer(user_id) and is_map(attrs),
    do: Lifecycle.publish(user_id, attrs, opts)

  @spec get_public(String.t()) :: ComparisonSnapshot.t() | nil
  def get_public(token) when is_binary(token), do: Lifecycle.get_public(token)
  def get_public(_token), do: nil

  @spec get_public_many([term()]) :: %{optional(String.t()) => ComparisonSnapshot.t() | nil}
  def get_public_many(tokens) when is_list(tokens), do: Lifecycle.get_public_many(tokens)

  @spec active_for_owner_query(pos_integer()) :: Ecto.Query.t()
  def active_for_owner_query(user_id) when is_integer(user_id),
    do: Lifecycle.active_for_owner_query(user_id)

  @spec revoke(pos_integer(), Ecto.UUID.t(), keyword()) ::
          {:ok, ComparisonSnapshot.t()} | {:error, :not_found | Ecto.Changeset.t()}
  def revoke(user_id, entropy_id, opts \\ [])

  def revoke(user_id, entropy_id, opts) when is_integer(user_id) and is_binary(entropy_id),
    do: Lifecycle.revoke(user_id, entropy_id, opts)

  def revoke(_user_id, _entropy_id, _opts), do: {:error, :not_found}

  @spec hydrate(ComparisonSnapshot.t() | nil) :: ComparisonSnapshot.t() | nil
  def hydrate(nil), do: nil

  def hydrate(%ComparisonSnapshot{} = snapshot), do: Lifecycle.hydrate(snapshot)

  @spec hydrate_many([ComparisonSnapshot.t()]) :: [ComparisonSnapshot.t()]
  def hydrate_many(snapshots) when is_list(snapshots), do: Lifecycle.hydrate_many(snapshots)
end

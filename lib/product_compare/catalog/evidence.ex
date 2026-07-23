defmodule ProductCompare.Catalog.Evidence do
  @moduledoc false

  import Ecto.Query

  alias ProductCompare.Repo
  alias ProductCompareSchemas.Catalog.Product
  alias ProductCompareSchemas.Catalog.ProductIdentifier
  alias ProductCompareSchemas.Catalog.ProductMedia

  @spec get_product_by_identifier(String.t(), String.t()) :: Product.t() | nil
  def get_product_by_identifier(scheme, normalized_value)
      when is_binary(scheme) and is_binary(normalized_value) do
    Product
    |> join(:inner, [product], identifier in ProductIdentifier,
      on: identifier.product_id == product.id
    )
    |> where(
      [_product, identifier],
      identifier.scheme == ^scheme and
        identifier.normalized_value == ^normalized_value and
        identifier.verification_status == "validated"
    )
    |> Repo.one()
  end

  @spec list_product_identifiers(pos_integer(), String.t()) :: [ProductIdentifier.t()]
  def list_product_identifiers(product_id, scheme)
      when is_integer(product_id) and is_binary(scheme) do
    ProductIdentifier
    |> where(
      [identifier],
      identifier.product_id == ^product_id and identifier.scheme == ^scheme
    )
    |> order_by([identifier], asc: identifier.id)
    |> Repo.all()
  end

  @spec create_product_identifier(map()) ::
          {:ok, ProductIdentifier.t()} | {:error, Ecto.Changeset.t()}
  def create_product_identifier(attrs) do
    %ProductIdentifier{}
    |> ProductIdentifier.changeset(attrs)
    |> Repo.insert()
  end

  @spec upsert_product_media(Product.t(), term(), list(), DateTime.t()) :: %{
          persisted: non_neg_integer(),
          rejected: non_neg_integer()
        }
  def upsert_product_media(%Product{} = product, source_artifact_id, observations, observed_at)
      when is_list(observations) do
    Enum.reduce(observations, %{persisted: 0, rejected: 0}, fn observation, result ->
      attrs = %{
        product_id: product.id,
        source_artifact_id: source_artifact_id,
        url: Map.get(observation, :url),
        role: observation |> Map.get(:role, :gallery) |> to_string(),
        position: Map.get(observation, :position, 0),
        alt_text: Map.get(observation, :alt_text),
        observed_at: observed_at
      }

      changeset = ProductMedia.changeset(%ProductMedia{}, attrs)
      now = DateTime.utc_now()

      case Repo.insert(changeset,
             on_conflict: [
               set: [
                 source_artifact_id: source_artifact_id,
                 role: attrs.role,
                 position: attrs.position,
                 alt_text: attrs.alt_text,
                 observed_at: observed_at,
                 updated_at: now
               ]
             ],
             conflict_target: [:product_id, :url],
             returning: true
           ) do
        {:ok, %ProductMedia{}} -> Map.update!(result, :persisted, &(&1 + 1))
        {:error, %Ecto.Changeset{}} -> Map.update!(result, :rejected, &(&1 + 1))
      end
    end)
  end

  @spec list_product_media(pos_integer()) :: [ProductMedia.t()]
  def list_product_media(product_id) when is_integer(product_id) do
    ProductMedia
    |> where([media], media.product_id == ^product_id)
    |> order_by([media], asc: media.position, asc: media.url, asc: media.id)
    |> preload([:source_artifact])
    |> Repo.all()
  end
end

defmodule ProductCompareWeb.Resolvers.Affiliate.Mutations do
  @moduledoc false

  alias ProductCompare.{Accounts, Affiliate, Repo}
  alias ProductCompareWeb.GraphQL.Authorization
  alias ProductCompareWeb.GraphQL.Errors, as: GraphQLErrors
  alias ProductCompareWeb.GraphQL.Input

  @spec upsert_affiliate_network(any(), map(), Absinthe.Resolution.t()) :: {:ok, map()}
  def upsert_affiliate_network(_parent, %{input: input}, resolution) do
    operator_affiliate_mutation(
      resolution,
      :network,
      input,
      [],
      [:name],
      &Affiliate.upsert_network/1
    )
  end

  def upsert_affiliate_network(_parent, _args, resolution),
    do: denied_mutation(:network, resolution)

  @spec upsert_affiliate_program(any(), map(), Absinthe.Resolution.t()) :: {:ok, map()}
  def upsert_affiliate_program(_parent, %{input: input}, resolution) do
    operator_affiliate_mutation(
      resolution,
      :program,
      input,
      [:affiliate_network_id, :merchant_id],
      program_attrs(),
      &Affiliate.upsert_program/1
    )
  end

  def upsert_affiliate_program(_parent, _args, resolution),
    do: denied_mutation(:program, resolution)

  @spec upsert_affiliate_link(any(), map(), Absinthe.Resolution.t()) :: {:ok, map()}
  def upsert_affiliate_link(_parent, %{input: input}, resolution) do
    operator_affiliate_mutation(
      resolution,
      :link,
      input,
      [:merchant_product_id, :affiliate_network_id],
      link_attrs(),
      &Affiliate.upsert_link/1
    )
  end

  def upsert_affiliate_link(_parent, _args, resolution),
    do: denied_mutation(:link, resolution)

  @spec create_coupon(any(), map(), Absinthe.Resolution.t()) :: {:ok, map()}
  def create_coupon(_parent, %{input: input}, resolution) do
    operator_affiliate_mutation(
      resolution,
      :coupon,
      input,
      [:merchant_id, :affiliate_network_id, :artifact_id],
      coupon_attrs(),
      &Affiliate.create_coupon/1
    )
  end

  def create_coupon(_parent, _args, resolution), do: denied_mutation(:coupon, resolution)

  defp normalize_attrs(attrs, id_fields, attr_fields) do
    with {:ok, attrs} <- normalize_ids(attrs, id_fields) do
      {:ok, Input.take(attrs, attr_fields)}
    end
  end

  defp affiliate_mutation(entity_field, input, id_fields, attr_fields, save_fun) do
    with {:ok, attrs} <- normalize_attrs(input, id_fields, attr_fields),
         {:ok, entity} <- save_fun.(attrs) do
      {:ok, %{entity_field => entity, errors: []}}
    else
      {:error, %Ecto.Changeset{} = changeset} ->
        {field, message} = GraphQLErrors.changeset_first_error(changeset)
        {:ok, mutation_error_payload(entity_field, "INVALID_ARGUMENT", message, field)}

      {:error, {:invalid_id, field}} ->
        {:ok,
         mutation_error_payload(entity_field, "INVALID_ID", invalid_id_message(field), field)}

      {:error, reason} when is_binary(reason) ->
        {:ok, mutation_error_payload(entity_field, "INVALID_ARGUMENT", reason)}
    end
  end

  defp operator_affiliate_mutation(
         resolution,
         entity_field,
         input,
         id_fields,
         attr_fields,
         save_fun
       ) do
    with {:ok, user} <- Authorization.require_operator(resolution) do
      Repo.transaction(fn ->
        case Accounts.lock_operator(user.id) do
          {:ok, _operator} ->
            affiliate_mutation(entity_field, input, id_fields, attr_fields, save_fun)

          {:error, reason} ->
            Repo.rollback(reason)
        end
      end)
      |> case do
        {:ok, result} ->
          result

        {:error, reason} ->
          {:ok,
           mutation_error_payload(
             entity_field,
             GraphQLErrors.authorization_mutation_error(reason)
           )}
      end
    else
      {:error, reason} ->
        {:ok,
         mutation_error_payload(entity_field, GraphQLErrors.authorization_mutation_error(reason))}
    end
  end

  defp denied_mutation(entity_field, resolution) do
    {:error, reason} = Authorization.require_operator(resolution)

    {:ok,
     mutation_error_payload(entity_field, GraphQLErrors.authorization_mutation_error(reason))}
  end

  defp normalize_ids(attrs, id_fields) do
    Enum.reduce_while(id_fields, {:ok, attrs}, fn field, {:ok, acc} ->
      case Input.decode_optional_integer_id_field(
             acc,
             field,
             field_type(field),
             id_field_name(field)
           ) do
        {:ok, attrs} ->
          {:cont, {:ok, attrs}}

        {:error, _message} ->
          {:halt, {:error, {:invalid_id, field}}}
      end
    end)
  end

  defp field_type(:affiliate_network_id), do: :affiliate_network
  defp field_type(:merchant_id), do: :merchant
  defp field_type(:merchant_product_id), do: :merchant_product
  defp field_type(:artifact_id), do: :source_artifact
  defp field_type(_field), do: nil

  defp program_attrs, do: [:affiliate_network_id, :merchant_id, :program_code, :status]

  defp link_attrs,
    do: [
      :merchant_product_id,
      :affiliate_network_id,
      :original_url,
      :affiliate_url,
      :last_verified_at
    ]

  defp coupon_attrs,
    do: [
      :merchant_id,
      :affiliate_network_id,
      :artifact_id,
      :code,
      :description,
      :discount_type,
      :discount_value,
      :currency,
      :valid_from,
      :valid_to,
      :terms
    ]

  defp id_field_name(field) do
    field
    |> Atom.to_string()
    |> String.replace_suffix("_id", "")
    |> String.replace("_", " ")
  end

  defp mutation_error_payload(entity_field, code, message, field \\ nil) do
    %{
      entity_field => nil,
      errors: [GraphQLErrors.camelized_mutation_error(code, message, field)]
    }
  end

  defp mutation_error_payload(entity_field, error) do
    %{
      entity_field => nil,
      errors: [error]
    }
  end

  defp invalid_id_message(field), do: "invalid #{id_field_name(field)} id"
end

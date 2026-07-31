defmodule ProductCompareWeb.Schema.Affiliate.Types do
  use Absinthe.Schema.Notation
  use Absinthe.Relay.Schema.Notation, :modern

  alias ProductCompareWeb.GraphQL.GlobalId

  input_object :upsert_affiliate_network_input do
    field :name, non_null(:string)
  end

  input_object :upsert_affiliate_program_input do
    field :affiliate_network_id, non_null(:id)
    field :merchant_id, non_null(:id)
    field :program_code, :string
    field :status, :string
  end

  input_object :upsert_affiliate_link_input do
    field :merchant_product_id, non_null(:id)
    field :affiliate_network_id, :id
    field :original_url, non_null(:string)
    field :affiliate_url, non_null(:string)
    field :last_verified_at, :datetime
  end

  input_object :create_coupon_input do
    field :merchant_id, non_null(:id)
    field :affiliate_network_id, :id
    field :artifact_id, :id
    field :code, non_null(:string)
    field :description, :string
    field :discount_type, non_null(:coupon_discount_type)
    field :discount_value, :decimal
    field :currency, :string
    field :valid_from, :datetime
    field :valid_to, :datetime
    field :terms, :string
  end

  input_object :active_coupons_input do
    field :merchant_id, non_null(:id)
    field :at, :datetime
    field :first, :integer
    field :after, :string
  end

  object :upsert_affiliate_network_payload do
    field :network, :affiliate_network
    field :errors, non_null(list_of(non_null(:mutation_error)))
  end

  object :upsert_affiliate_program_payload do
    field :program, :affiliate_program
    field :errors, non_null(list_of(non_null(:mutation_error)))
  end

  object :upsert_affiliate_link_payload do
    field :link, :affiliate_link
    field :errors, non_null(list_of(non_null(:mutation_error)))
  end

  object :create_coupon_payload do
    field :coupon, :coupon
    field :errors, non_null(list_of(non_null(:mutation_error)))
  end

  object :active_coupons_payload do
    field :coupons, non_null(:coupon_connection)
  end

  node object(:affiliate_network) do
    field :name, non_null(:string)
    field :inserted_at, non_null(:datetime)
    field :updated_at, non_null(:datetime)
  end

  node object(:affiliate_program) do
    field :affiliate_network_id, non_null(:id) do
      resolve(fn program, _, _ ->
        GlobalId.encode_required(:affiliate_network, program.affiliate_network_id)
      end)
    end

    field :merchant_id, non_null(:id) do
      resolve(fn program, _, _ -> GlobalId.encode_required(:merchant, program.merchant_id) end)
    end

    field :program_code, :string
    field :status, :string
    field :inserted_at, non_null(:datetime)
    field :updated_at, non_null(:datetime)
  end

  node object(:affiliate_link) do
    field :merchant_product_id, non_null(:id) do
      resolve(fn link, _, _ ->
        GlobalId.encode_required(:merchant_product, link.merchant_product_id)
      end)
    end

    field :affiliate_network_id, :id do
      resolve(fn link, _, _ ->
        GlobalId.encode_optional(:affiliate_network, link.affiliate_network_id)
      end)
    end

    field :original_url, non_null(:string)
    field :affiliate_url, non_null(:string)
    field :last_verified_at, :datetime
    field :inserted_at, non_null(:datetime)
    field :updated_at, non_null(:datetime)
  end

  node object(:coupon) do
    field :merchant_id, non_null(:id) do
      resolve(fn coupon, _, _ -> GlobalId.encode_required(:merchant, coupon.merchant_id) end)
    end

    field :affiliate_network_id, :id do
      resolve(fn coupon, _, _ ->
        GlobalId.encode_optional(:affiliate_network, coupon.affiliate_network_id)
      end)
    end

    field :artifact_id, :id do
      resolve(fn coupon, _, _ ->
        GlobalId.encode_optional(:source_artifact, coupon.artifact_id)
      end)
    end

    field :code, non_null(:string)
    field :description, :string
    field :discount_type, non_null(:coupon_discount_type)
    field :discount_value, :decimal
    field :currency, :string
    field :valid_from, :datetime
    field :valid_to, :datetime
    field :terms, :string
    field :inserted_at, non_null(:datetime)
    field :updated_at, non_null(:datetime)
  end

  connection node_type: :coupon, non_null_edges: true, non_null_edge: true do
    edge do
      field :node, non_null(:coupon)
      field :cursor, non_null(:string)
    end
  end

  object :active_coupon do
    field :code, non_null(:string)
    field :description, :string
    field :discount_type, non_null(:coupon_discount_type)
    field :discount_value, :decimal
    field :currency, :string
    field :valid_to, :datetime
    field :terms, :string
  end

  connection node_type: :active_coupon, non_null_edges: true, non_null_edge: true do
    edge do
      field :node, non_null(:active_coupon)
      field :cursor, non_null(:string)
    end
  end

  enum :coupon_discount_type do
    value(:percent)
    value(:amount)
    value(:free_shipping)
    value(:other)
  end
end

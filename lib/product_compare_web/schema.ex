defmodule ProductCompareWeb.Schema do
  use Absinthe.Schema

  import_types(Absinthe.Type.Custom)

  alias ProductCompareWeb.GraphQL.GlobalId
  alias ProductCompareWeb.Resolvers.AffiliateResolver
  alias ProductCompareWeb.Resolvers.AuthResolver

  query do
    @desc "Returns the current authenticated user, if any."
    field :viewer, :user do
      resolve(&AuthResolver.viewer/3)
    end

    @desc "Returns API tokens owned by the current authenticated user."
    field :my_api_tokens, non_null(:api_token_connection) do
      arg(:first, :integer)
      arg(:after, :string)
      arg(:status, :api_token_status_filter)

      resolve(&AuthResolver.my_api_tokens/3)
    end

    @desc "Returns active coupons for a merchant at a specific timestamp (or now by default)."
    field :active_coupons, :active_coupons_payload do
      arg(:input, non_null(:active_coupons_input))

      resolve(&AffiliateResolver.active_coupons/3)
    end
  end

  mutation do
    @desc "Creates a new API token for the current authenticated user."
    field :create_api_token, non_null(:create_api_token_payload) do
      arg(:label, :string)
      arg(:expires_at, :datetime)

      resolve(&AuthResolver.create_api_token/3)
    end

    @desc "Revokes one of the current authenticated user's API tokens."
    field :revoke_api_token, non_null(:revoke_api_token_payload) do
      arg(:token_id, non_null(:id))

      resolve(&AuthResolver.revoke_api_token/3)
    end

    @desc "Rotates one of the current authenticated user's API tokens."
    field :rotate_api_token, non_null(:create_api_token_payload) do
      arg(:token_id, non_null(:id))
      arg(:label, :string)
      arg(:expires_at, :datetime)

      resolve(&AuthResolver.rotate_api_token/3)
    end

    @desc "Upserts an affiliate network by name."
    field :upsert_affiliate_network, :upsert_affiliate_network_payload do
      arg(:input, non_null(:upsert_affiliate_network_input))

      resolve(&AffiliateResolver.upsert_affiliate_network/3)
    end

    @desc "Upserts an affiliate program by affiliate network and merchant."
    field :upsert_affiliate_program, :upsert_affiliate_program_payload do
      arg(:input, non_null(:upsert_affiliate_program_input))

      resolve(&AffiliateResolver.upsert_affiliate_program/3)
    end

    @desc "Upserts an affiliate link by merchant product."
    field :upsert_affiliate_link, :upsert_affiliate_link_payload do
      arg(:input, non_null(:upsert_affiliate_link_input))

      resolve(&AffiliateResolver.upsert_affiliate_link/3)
    end

    @desc "Creates a coupon for a merchant."
    field :create_coupon, :create_coupon_payload do
      arg(:input, non_null(:create_coupon_input))

      resolve(&AffiliateResolver.create_coupon/3)
    end
  end

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
  end

  object :upsert_affiliate_network_payload do
    field :network, non_null(:affiliate_network)
  end

  object :upsert_affiliate_program_payload do
    field :program, non_null(:affiliate_program)
  end

  object :upsert_affiliate_link_payload do
    field :link, non_null(:affiliate_link)
  end

  object :create_coupon_payload do
    field :coupon, non_null(:coupon)
  end

  object :active_coupons_payload do
    field :coupons, non_null(list_of(non_null(:coupon)))
  end

  object :affiliate_network do
    field :id, non_null(:id)
    field :name, non_null(:string)
    field :inserted_at, non_null(:datetime)
    field :updated_at, non_null(:datetime)
  end

  object :affiliate_program do
    field :id, non_null(:id)
    field :affiliate_network_id, non_null(:id)
    field :merchant_id, non_null(:id)
    field :program_code, :string
    field :status, :string
    field :inserted_at, non_null(:datetime)
    field :updated_at, non_null(:datetime)
  end

  object :affiliate_link do
    field :id, non_null(:id)
    field :merchant_product_id, non_null(:id)
    field :affiliate_network_id, :id
    field :original_url, non_null(:string)
    field :affiliate_url, non_null(:string)
    field :last_verified_at, :datetime
    field :inserted_at, non_null(:datetime)
    field :updated_at, non_null(:datetime)
  end

  object :coupon do
    field :id, non_null(:id)
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
    field :inserted_at, non_null(:datetime)
    field :updated_at, non_null(:datetime)
  end

  enum :coupon_discount_type do
    value(:percent)
    value(:amount)
    value(:free_shipping)
    value(:other)
  end

  object :create_api_token_payload do
    field :plain_text_token, :string
    field :api_token, :api_token
    field :errors, non_null(list_of(non_null(:mutation_error)))
  end

  object :revoke_api_token_payload do
    field :api_token, :api_token
    field :errors, non_null(list_of(non_null(:mutation_error)))
  end

  object :mutation_error do
    field :code, non_null(:string)
    field :message, non_null(:string)
    field :field, :string
  end

  object :user do
    field :id, non_null(:id) do
      resolve(fn user, _, _ -> {:ok, GlobalId.encode(:user, user.entropy_id)} end)
    end

    field :email, non_null(:string)
  end

  object :api_token do
    field :id, non_null(:id) do
      resolve(fn api_token, _, _ -> {:ok, GlobalId.encode(:api_token, api_token.entropy_id)} end)
    end

    field :label, :string
    field :token_prefix, non_null(:string)
    field :last_used_at, :datetime
    field :expires_at, :datetime
    field :revoked_at, :datetime
    field :inserted_at, non_null(:datetime)
  end

  object :api_token_connection do
    field :edges, non_null(list_of(non_null(:api_token_edge)))
    field :page_info, non_null(:page_info)
  end

  object :api_token_edge do
    field :cursor, non_null(:string)
    field :node, non_null(:api_token)
  end

  enum :api_token_status_filter do
    value(:active)
    value(:revoked)
    value(:all)
  end

  object :page_info do
    field :has_next_page, non_null(:boolean)
    field :has_previous_page, non_null(:boolean)
    field :start_cursor, :string
    field :end_cursor, :string
  end
end

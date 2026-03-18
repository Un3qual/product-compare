defmodule ProductCompareWeb.Schema do
  use Absinthe.Schema

  import_types(Absinthe.Type.Custom)

  alias ProductCompareWeb.GraphQL.GlobalId
  alias ProductCompareWeb.Resolvers.AffiliateResolver
  alias ProductCompareWeb.Resolvers.AuthResolver
  alias ProductCompareWeb.Resolvers.CatalogResolver
  alias ProductCompareWeb.Resolvers.PricingResolver

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

    @desc "Returns a single product by slug."
    field :product, :product do
      arg(:slug, non_null(:string))

      resolve(&CatalogResolver.product/3)
    end

    @desc "Returns products ordered by primary key with cursor pagination."
    field :products, :product_connection do
      arg(:first, :integer)
      arg(:after, :string)
      arg(:filters, :product_filters_input)

      resolve(&CatalogResolver.products/3)
    end

    @desc "Returns merchants ordered by primary key with cursor pagination."
    field :merchants, :merchant_connection do
      arg(:first, :integer)
      arg(:after, :string)

      resolve(&PricingResolver.merchants/3)
    end

    @desc "Returns merchant products for a product with optional merchant and active filters."
    field :merchant_products, :merchant_product_connection do
      arg(:input, non_null(:merchant_products_input))

      resolve(&PricingResolver.merchant_products/3)
    end
  end

  mutation do
    @desc "Creates a new user session by registering an email/password account."
    field :register, non_null(:auth_session_payload) do
      arg(:email, non_null(:string))
      arg(:password, non_null(:string))

      resolve(&AuthResolver.register/3)
    end

    @desc "Creates a new user session from email/password credentials."
    field :login, non_null(:auth_session_payload) do
      arg(:email, non_null(:string))
      arg(:password, non_null(:string))

      resolve(&AuthResolver.login/3)
    end

    @desc "Deletes the current browser session."
    field :logout, non_null(:logout_payload) do
      resolve(&AuthResolver.logout/3)
    end

    @desc "Requests a password reset email for an existing account."
    field :forgot_password, non_null(:auth_action_payload) do
      arg(:email, non_null(:string))

      resolve(&AuthResolver.forgot_password/3)
    end

    @desc "Resets an account password using a previously issued reset token."
    field :reset_password, non_null(:auth_action_payload) do
      arg(:token, non_null(:string))
      arg(:password, non_null(:string))

      resolve(&AuthResolver.reset_password/3)
    end

    @desc "Confirms an account email using a previously issued verification token."
    field :verify_email, non_null(:auth_action_payload) do
      arg(:token, non_null(:string))

      resolve(&AuthResolver.verify_email/3)
    end

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
    field :first, :integer
    field :after, :string
  end

  input_object :merchant_products_input do
    field :product_id, non_null(:id)
    field :merchant_id, :id
    field :active_only, :boolean
    field :first, :integer
    field :after, :string
  end

  input_object :product_numeric_filter_input do
    field :attribute_id, non_null(:id)
    field :min, :decimal
    field :max, :decimal
  end

  input_object :product_boolean_filter_input do
    field :attribute_id, non_null(:id)
    field :value, non_null(:boolean)
  end

  input_object :product_enum_filter_input do
    field :attribute_id, non_null(:id)
    field :enum_option_id, non_null(:id)
  end

  input_object :product_filters_input do
    field :primary_type_taxon_id, :id
    field :include_type_descendants, :boolean
    field :numeric, list_of(non_null(:product_numeric_filter_input))
    field :booleans, list_of(non_null(:product_boolean_filter_input))
    field :enums, list_of(non_null(:product_enum_filter_input))
    field :use_case_taxon_ids, list_of(non_null(:id))
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

  object :affiliate_network do
    field :id, non_null(:id) do
      resolve(fn network, _, _ -> encode_required_global_id(:affiliate_network, network.id) end)
    end

    field :name, non_null(:string)
    field :inserted_at, non_null(:datetime)
    field :updated_at, non_null(:datetime)
  end

  object :affiliate_program do
    field :id, non_null(:id) do
      resolve(fn program, _, _ -> encode_required_global_id(:affiliate_program, program.id) end)
    end

    field :affiliate_network_id, non_null(:id) do
      resolve(fn program, _, _ ->
        encode_required_global_id(:affiliate_network, program.affiliate_network_id)
      end)
    end

    field :merchant_id, non_null(:id) do
      resolve(fn program, _, _ -> encode_required_global_id(:merchant, program.merchant_id) end)
    end

    field :program_code, :string
    field :status, :string
    field :inserted_at, non_null(:datetime)
    field :updated_at, non_null(:datetime)
  end

  object :affiliate_link do
    field :id, non_null(:id) do
      resolve(fn link, _, _ -> encode_required_global_id(:affiliate_link, link.id) end)
    end

    field :merchant_product_id, non_null(:id) do
      resolve(fn link, _, _ ->
        encode_required_global_id(:merchant_product, link.merchant_product_id)
      end)
    end

    field :affiliate_network_id, :id do
      resolve(fn link, _, _ ->
        encode_optional_global_id(:affiliate_network, link.affiliate_network_id)
      end)
    end

    field :original_url, non_null(:string)
    field :affiliate_url, non_null(:string)
    field :last_verified_at, :datetime
    field :inserted_at, non_null(:datetime)
    field :updated_at, non_null(:datetime)
  end

  object :coupon do
    field :id, non_null(:id) do
      resolve(fn coupon, _, _ -> encode_required_global_id(:coupon, coupon.id) end)
    end

    field :merchant_id, non_null(:id) do
      resolve(fn coupon, _, _ -> encode_required_global_id(:merchant, coupon.merchant_id) end)
    end

    field :affiliate_network_id, :id do
      resolve(fn coupon, _, _ ->
        encode_optional_global_id(:affiliate_network, coupon.affiliate_network_id)
      end)
    end

    field :artifact_id, :id do
      resolve(fn coupon, _, _ ->
        encode_optional_global_id(:source_artifact, coupon.artifact_id)
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

  object :coupon_connection do
    field :edges, non_null(list_of(non_null(:coupon_edge)))
    field :page_info, non_null(:page_info)
  end

  object :coupon_edge do
    field :cursor, non_null(:string)
    field :node, non_null(:coupon)
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

  object :auth_session_payload do
    field :viewer, :user
    field :errors, non_null(list_of(non_null(:mutation_error)))
  end

  object :logout_payload do
    field :ok, non_null(:boolean)
    field :errors, non_null(list_of(non_null(:mutation_error)))
  end

  object :auth_action_payload do
    field :ok, non_null(:boolean)
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

  object :brand do
    field :id, non_null(:id) do
      resolve(fn brand, _, _ -> encode_required_global_id(:brand, brand.id) end)
    end

    field :name, non_null(:string)
  end

  object :merchant do
    field :id, non_null(:id) do
      resolve(fn merchant, _, _ -> encode_required_global_id(:merchant, merchant.id) end)
    end

    field :name, non_null(:string)
    field :domain, non_null(:string)
    field :inserted_at, non_null(:datetime)
    field :updated_at, non_null(:datetime)
  end

  object :merchant_connection do
    field :edges, non_null(list_of(non_null(:merchant_edge)))
    field :page_info, non_null(:page_info)
  end

  object :merchant_edge do
    field :cursor, non_null(:string)
    field :node, non_null(:merchant)
  end

  object :product do
    field :id, non_null(:id) do
      resolve(fn product, _, _ -> encode_required_global_id(:product, product.id) end)
    end

    field :name, non_null(:string)
    field :slug, non_null(:string)
    field :model_number, :string
    field :description, :string
    field :brand, :brand
  end

  object :merchant_product do
    field :id, non_null(:id) do
      resolve(fn merchant_product, _, _ ->
        encode_required_global_id(:merchant_product, merchant_product.id)
      end)
    end

    field :merchant_id, non_null(:id) do
      resolve(fn merchant_product, _, _ ->
        encode_required_global_id(:merchant, merchant_product.merchant_id)
      end)
    end

    field :product_id, non_null(:id) do
      resolve(fn merchant_product, _, _ ->
        encode_required_global_id(:product, merchant_product.product_id)
      end)
    end

    field :external_sku, :string
    field :url, non_null(:string)
    field :currency, non_null(:string)
    field :last_seen_at, :datetime
    field :is_active, non_null(:boolean)
    field :merchant, :merchant
    field :product, :product
    field :latest_price, :price_point, resolve: &PricingResolver.latest_price/3

    field :price_history, :price_point_connection do
      arg(:first, :integer)
      arg(:after, :string)
      arg(:from, :datetime)
      arg(:to, :datetime)

      resolve(&PricingResolver.price_history/3)
    end

    field :inserted_at, non_null(:datetime)
    field :updated_at, non_null(:datetime)
  end

  object :price_point do
    field :id, non_null(:id) do
      resolve(fn price_point, _, _ -> encode_required_global_id(:price_point, price_point.id) end)
    end

    field :merchant_product_id, non_null(:id) do
      resolve(fn price_point, _, _ ->
        encode_required_global_id(:merchant_product, price_point.merchant_product_id)
      end)
    end

    field :observed_at, non_null(:datetime)
    field :price, non_null(:decimal)
    field :inserted_at, non_null(:datetime)
    field :updated_at, :datetime
  end

  object :price_point_connection do
    field :edges, non_null(list_of(non_null(:price_point_edge)))
    field :page_info, non_null(:page_info)
  end

  object :price_point_edge do
    field :cursor, non_null(:string)
    field :node, non_null(:price_point)
  end

  object :merchant_product_connection do
    field :edges, non_null(list_of(non_null(:merchant_product_edge)))
    field :page_info, non_null(:page_info)
  end

  object :merchant_product_edge do
    field :cursor, non_null(:string)
    field :node, non_null(:merchant_product)
  end

  object :product_connection do
    field :edges, non_null(list_of(non_null(:product_edge)))
    field :page_info, non_null(:page_info)
  end

  object :product_edge do
    field :cursor, non_null(:string)
    field :node, non_null(:product)
  end

  defp encode_required_global_id(type, value) when is_integer(value) do
    {:ok, GlobalId.encode(type, Integer.to_string(value))}
  end

  defp encode_required_global_id(type, value) when is_binary(value) do
    {:ok, GlobalId.encode(type, value)}
  end

  defp encode_required_global_id(_type, _value), do: {:error, "invalid id"}

  defp encode_optional_global_id(_type, nil), do: {:ok, nil}
  defp encode_optional_global_id(type, value), do: encode_required_global_id(type, value)
end

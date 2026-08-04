defmodule ProductCompareSchemas.CommerceAttribution.CommerceClickSession do
  use ProductCompareSchemas.Schema, :relational

  @source_surfaces [:web, :api, :extension]

  @type t :: %__MODULE__{}

  schema "commerce_click_sessions" do
    field :entropy_id, Ecto.UUID
    field :click_id, Ecto.UUID
    field :anonymous_id, :string
    field :source_surface, Ecto.Enum, values: @source_surfaces, default: :web
    field :referrer, :string
    field :user_agent, :string
    field :ip_address, EctoNetwork.INET

    belongs_to :commerce_link, ProductCompareSchemas.CommerceAttribution.CommerceLink
    belongs_to :merchant_product, ProductCompareSchemas.Pricing.MerchantProduct
    belongs_to :user, ProductCompareSchemas.Accounts.User

    has_many :conversions, ProductCompareSchemas.CommerceAttribution.CommerceConversion,
      foreign_key: :click_session_id

    timestamps()
  end

  @spec changeset(t(), map()) :: Ecto.Changeset.t()
  def changeset(click_session, attrs) do
    click_session
    |> cast(attrs, [
      :click_id,
      :commerce_link_id,
      :merchant_product_id,
      :user_id,
      :anonymous_id,
      :source_surface,
      :referrer,
      :user_agent,
      :ip_address
    ])
    |> put_generated_click_id()
    |> validate_required([:click_id, :commerce_link_id, :source_surface])
    |> validate_host_address()
    |> unique_constraint(:click_id)
    |> foreign_key_constraint(:commerce_link_id)
    |> foreign_key_constraint(:merchant_product_id)
    |> foreign_key_constraint(:user_id)
    |> check_constraint(:ip_address,
      name: :commerce_click_sessions_ip_address_host_check,
      message: "must be a host address"
    )
  end

  defp put_generated_click_id(changeset) do
    case get_field(changeset, :click_id) do
      nil -> put_change(changeset, :click_id, Ecto.UUID.generate())
      _click_id -> changeset
    end
  end

  defp validate_host_address(changeset) do
    validate_change(changeset, :ip_address, fn :ip_address,
                                               %Postgrex.INET{
                                                 address: address,
                                                 netmask: netmask
                                               } ->
      if netmask in [nil, host_netmask(address)] do
        []
      else
        [ip_address: "must be a host address"]
      end
    end)
  end

  defp host_netmask(address) when tuple_size(address) == 4, do: 32
  defp host_netmask(address) when tuple_size(address) == 8, do: 128
end

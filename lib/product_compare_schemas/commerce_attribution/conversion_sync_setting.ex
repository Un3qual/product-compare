defmodule ProductCompareSchemas.CommerceAttribution.ConversionSyncSetting do
  use ProductCompareSchemas.Schema, :relational

  alias ProductCompareSchemas.Accounts.User
  alias ProductCompareSchemas.Affiliate.AffiliateNetwork

  @type t :: %__MODULE__{}

  schema "commerce_conversion_sync_settings" do
    belongs_to :affiliate_network, AffiliateNetwork
    field :enabled, :boolean, default: false
    field :interval_minutes, :integer, default: 1_440
    field :lookback_days, :integer, default: 90
    field :max_pages, :integer, default: 100
    field :next_run_at, :utc_datetime_usec
    belongs_to :updated_by_user, User

    timestamps()
  end

  @spec changeset(t(), map()) :: Ecto.Changeset.t()
  def changeset(setting, attrs) do
    setting
    |> cast(attrs, [
      :affiliate_network_id,
      :enabled,
      :interval_minutes,
      :lookback_days,
      :max_pages,
      :next_run_at,
      :updated_by_user_id
    ])
    |> validate_required([
      :affiliate_network_id,
      :enabled,
      :interval_minutes,
      :lookback_days,
      :max_pages
    ])
    |> validate_number(:interval_minutes,
      greater_than_or_equal_to: 15,
      less_than_or_equal_to: 10_080
    )
    |> validate_number(:lookback_days, greater_than_or_equal_to: 1, less_than_or_equal_to: 90)
    |> validate_number(:max_pages, greater_than_or_equal_to: 1, less_than_or_equal_to: 100)
    |> validate_disabled_next_run()
    |> unique_constraint(:affiliate_network_id,
      name: :commerce_conversion_sync_settings_network_uq
    )
    |> foreign_key_constraint(:affiliate_network_id)
    |> foreign_key_constraint(:updated_by_user_id)
    |> check_constraint(:interval_minutes,
      name: :commerce_conversion_sync_settings_interval_bounds
    )
    |> check_constraint(:lookback_days,
      name: :commerce_conversion_sync_settings_lookback_bounds
    )
    |> check_constraint(:max_pages,
      name: :commerce_conversion_sync_settings_max_pages_bounds
    )
    |> check_constraint(:next_run_at,
      name: :commerce_conversion_sync_settings_enabled_next_run
    )
  end

  defp validate_disabled_next_run(changeset) do
    if get_field(changeset, :enabled) == false and not is_nil(get_field(changeset, :next_run_at)) do
      add_error(changeset, :next_run_at, "must be empty when disabled")
    else
      changeset
    end
  end
end

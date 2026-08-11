defmodule ProductCompareWeb.Schema.Home.Types do
  use Absinthe.Schema.Notation

  alias ProductCompareWeb.GraphQL.GlobalId

  enum :home_deal_reason_code do
    value(:new_offer)
    value(:trending_below_median)
    value(:watch_target)
    value(:saved_comparison)
    value(:current_comparison)
  end

  enum :home_price_signal_code do
    value(:below_30_day_median)
    value(:at_or_above_30_day_median)
    value(:no_30_day_baseline)
  end

  object :home_workspace do
    field :products, non_null(list_of(non_null(:home_workspace_product)))
    field :selected_products, non_null(list_of(non_null(:product)))
    field :categories, non_null(list_of(non_null(:home_category_shortcut)))
  end

  object :home_workspace_product do
    field :product, non_null(:product)
    field :highlights, non_null(list_of(non_null(:home_specification_highlight)))
    field :offer, non_null(:home_offer_summary)
  end

  object :home_category_shortcut do
    field :taxon_id, non_null(:id) do
      resolve(fn category, _, _ -> GlobalId.encode_required(:taxon, category.id) end)
    end

    field :name, non_null(:string)
    field :slug, non_null(:string)
    field :description, non_null(:string)
    field :qualified_product_count, non_null(:integer)
  end

  object :home_specification_highlight do
    field :label, non_null(:string) do
      resolve(fn %{attribute: attribute}, _, _ -> {:ok, attribute.display_name} end)
    end

    field :value, non_null(:string) do
      resolve(fn %{claim: claim}, _, _ ->
        {:ok, ProductCompare.Specs.ClaimValue.format(claim)}
      end)
    end
  end

  object :home_offer_summary do
    field :merchant_product_id, non_null(:id) do
      resolve(fn offer, _, _ ->
        GlobalId.encode_required(:merchant_product, offer.merchant_product_id)
      end)
    end

    field :merchant_name, non_null(:string)
    field :currency, non_null(:string)
    field :landed_price, non_null(:decimal)
    field :active_offer_count, non_null(:integer)
    field :price_signal, non_null(:home_price_signal_code), resolve: &price_signal/3
    field :observed_at, non_null(:datetime)
  end

  object :home_deals do
    field :new, non_null(list_of(non_null(:home_deal)))
    field :trending, non_null(list_of(non_null(:home_deal)))
    field :for_you, non_null(list_of(non_null(:home_deal)))
  end

  object :home_deal do
    field :product, non_null(:product)
    field :offer, non_null(:home_offer_summary)
    field :reasons, non_null(list_of(non_null(:home_deal_reason)))
  end

  object :home_deal_reason do
    field :code, non_null(:home_deal_reason_code)
    field :watch_target, :decimal
  end

  defp price_signal(%{median_30d: nil}, _args, _resolution), do: {:ok, :no_30_day_baseline}

  defp price_signal(%{below_30_day_median?: true}, _args, _resolution),
    do: {:ok, :below_30_day_median}

  defp price_signal(_offer, _args, _resolution), do: {:ok, :at_or_above_30_day_median}
end

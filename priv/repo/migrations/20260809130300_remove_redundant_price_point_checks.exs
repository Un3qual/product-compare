defmodule ProductCompare.Repo.Migrations.RemoveRedundantPricePointChecks do
  use Ecto.Migration

  def up do
    drop constraint(:price_points, :price_must_be_non_negative)
    drop constraint(:price_points, :shipping_must_be_non_negative)
  end

  def down do
    create constraint(:price_points, :price_must_be_non_negative, check: "price >= 0")

    create constraint(:price_points, :shipping_must_be_non_negative,
             check: "shipping IS NULL OR shipping >= 0"
           )
  end
end

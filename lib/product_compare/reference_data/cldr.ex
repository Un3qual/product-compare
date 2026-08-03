defmodule ProductCompare.ReferenceData.Cldr do
  @moduledoc false

  use Cldr,
    otp_app: :product_compare,
    providers: [Cldr.Currency, Cldr.Territory, Cldr.Language]
end

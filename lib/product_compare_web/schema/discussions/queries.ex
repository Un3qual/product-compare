defmodule ProductCompareWeb.Schema.Discussions.Queries do
  use Absinthe.Schema.Notation

  alias ProductCompareWeb.Resolvers.Discussions.Reads

  object :discussions_queries do
    @desc "Returns a published product question by global ID."
    field :product_question, :product_question do
      arg(:id, non_null(:id))
      resolve(&Reads.question/3)
    end
  end
end

defmodule ProductCompareWeb.Schema.Discussions.Queries do
  use Absinthe.Schema.Notation

  alias ProductCompareWeb.Resolvers.DiscussionsResolver

  object :discussions_queries do
    @desc "Returns a published product question by global ID."
    field :product_question, :product_question do
      arg(:id, non_null(:id))
      resolve(&DiscussionsResolver.question/3)
    end
  end
end

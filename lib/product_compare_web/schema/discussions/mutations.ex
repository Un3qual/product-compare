defmodule ProductCompareWeb.Schema.Discussions.Mutations do
  use Absinthe.Schema.Notation

  alias ProductCompareWeb.Resolvers.Discussions.Mutations

  object :discussions_mutations do
    @desc "Submits one authenticated product review for moderation."
    field :submit_product_review, non_null(:product_review_payload) do
      arg(:input, non_null(:submit_product_review_input))
      resolve(&Mutations.submit_review/3)
    end

    @desc "Submits an authenticated product question for moderation."
    field :ask_product_question, non_null(:product_question_payload) do
      arg(:input, non_null(:ask_product_question_input))
      resolve(&Mutations.ask_question/3)
    end

    @desc "Submits an authenticated answer to a published question."
    field :answer_product_question, non_null(:product_answer_payload) do
      arg(:input, non_null(:answer_product_question_input))
      resolve(&Mutations.answer_question/3)
    end

    @desc "Updates one review owned by the current user and resubmits it for moderation."
    field :update_product_review, non_null(:product_review_payload) do
      arg(:input, non_null(:update_product_review_input))
      resolve(&Mutations.update_review/3)
    end

    @desc "Updates one question owned by the current user and resubmits it for moderation."
    field :update_product_question, non_null(:product_question_payload) do
      arg(:input, non_null(:update_product_question_input))
      resolve(&Mutations.update_question/3)
    end

    @desc "Updates one answer owned by the current user and resubmits it for moderation."
    field :update_product_answer, non_null(:product_answer_payload) do
      arg(:input, non_null(:update_product_answer_input))
      resolve(&Mutations.update_answer/3)
    end

    @desc "Soft-removes review or Q&A content owned by the current user."
    field :remove_community_content, non_null(:remove_community_content_payload) do
      arg(:input, non_null(:remove_community_content_input))
      resolve(&Mutations.remove/3)
    end

    @desc "Marks one published answer as accepted by the question owner."
    field :accept_product_answer, non_null(:product_question_payload) do
      arg(:question_id, non_null(:id))
      arg(:answer_id, non_null(:id))
      resolve(&Mutations.accept_answer/3)
    end

    @desc "Reports review or Q&A content for operator moderation."
    field :report_community_content, non_null(:community_report_payload) do
      arg(:input, non_null(:report_community_content_input))
      resolve(&Mutations.report/3)
    end

    @desc "Publishes, hides, or rejects community content as an operator."
    field :moderate_community_content, non_null(:community_moderation_payload) do
      arg(:input, non_null(:moderate_community_content_input))
      resolve(&Mutations.moderate/3)
    end
  end
end

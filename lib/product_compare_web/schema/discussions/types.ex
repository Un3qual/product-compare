defmodule ProductCompareWeb.Schema.Discussions.Types do
  use Absinthe.Schema.Notation
  use Absinthe.Relay.Schema.Notation, :modern

  alias ProductCompareWeb.GraphQL.GlobalId
  alias ProductCompareWeb.Resolvers.Discussions.ContentFields
  alias ProductCompareWeb.Resolvers.Discussions.Reads

  input_object :submit_product_review_input do
    field :product_id, non_null(:id)
    field :idempotency_key, :string
    field :rating, non_null(:integer)
    field :title, :string
    field :body, :string
    field :merchant_product_id, :id
  end

  input_object :ask_product_question_input do
    field :product_id, non_null(:id)
    field :idempotency_key, :string
    field :title, non_null(:string)
    field :body, :string
  end

  input_object :answer_product_question_input do
    field :question_id, non_null(:id)
    field :idempotency_key, :string
    field :body, non_null(:string)
  end

  input_object :update_product_review_input do
    field :id, non_null(:id)
    field :rating, :integer
    field :title, :string
    field :body, :string
  end

  input_object :update_product_question_input do
    field :id, non_null(:id)
    field :title, :string
    field :body, :string
  end

  input_object :update_product_answer_input do
    field :id, non_null(:id)
    field :body, :string
  end

  input_object :remove_community_content_input do
    field :content_type, non_null(:community_content_type)
    field :content_id, non_null(:id)
  end

  enum :community_content_type do
    value(:review)
    value(:question)
    value(:answer)
  end

  enum :community_moderation_status do
    value(:pending)
    value(:published)
    value(:hidden)
    value(:rejected)
    value(:removed)
  end

  input_object :report_community_content_input do
    field :content_type, non_null(:community_content_type)
    field :content_id, non_null(:id)
    field :reason, non_null(:string)
  end

  input_object :moderate_community_content_input do
    field :content_type, non_null(:community_content_type)
    field :content_id, non_null(:id)
    field :status, non_null(:community_moderation_status)
    field :note, :string
  end

  object :product_review_payload do
    field :review, :product_review
    field :errors, non_null(list_of(non_null(:mutation_error)))
  end

  object :remove_community_content_payload do
    field :removed_content_id, :id
    field :errors, non_null(list_of(non_null(:mutation_error)))
  end

  object :product_question_payload do
    field :question, :product_question
    field :errors, non_null(list_of(non_null(:mutation_error)))
  end

  object :product_answer_payload do
    field :answer, :product_answer
    field :errors, non_null(list_of(non_null(:mutation_error)))
  end

  object :community_report_payload do
    field :report_id, :id
    field :errors, non_null(list_of(non_null(:mutation_error)))
  end

  object :community_moderation_payload do
    field :content_id, :id
    field :moderation_status, :community_moderation_status
    field :errors, non_null(list_of(non_null(:mutation_error)))
  end

  object :product_review_summary do
    field :count, non_null(:integer)
    field :average_rating, :decimal
  end

  object :viewer_community_submissions do
    field :reviews, non_null(list_of(non_null(:product_review)))
    field :questions, non_null(list_of(non_null(:product_question)))
    field :answers, non_null(list_of(non_null(:product_answer)))
  end

  object :product_review do
    field :id, non_null(:id) do
      resolve(fn review, _, _ -> GlobalId.encode_required(:product_review, review.entropy_id) end)
    end

    field :rating, non_null(:integer)
    field :title, :string
    field :body, :string, resolve: &ContentFields.body/3
    field :verified_purchase, non_null(:boolean)
    field :moderation_status, non_null(:community_moderation_status)
    field :author_label, non_null(:string), resolve: &ContentFields.author_label/3
    field :viewer_can_edit, non_null(:boolean), resolve: &ContentFields.viewer_can_edit/3

    field :viewer_can_remove, non_null(:boolean), resolve: &ContentFields.viewer_can_remove/3

    field :created_at, non_null(:datetime),
      resolve: fn review, _, _ -> {:ok, review.inserted_at} end
  end

  connection(node_type: :product_review, non_null_edges: true, non_null_edge: true)

  object :product_question do
    field :id, non_null(:id) do
      resolve(fn question, _, _ ->
        GlobalId.encode_required(:product_question, question.entropy_id)
      end)
    end

    field :title, non_null(:string)
    field :body, :string, resolve: &ContentFields.body/3
    field :moderation_status, non_null(:community_moderation_status)
    field :author_label, non_null(:string), resolve: &ContentFields.author_label/3
    field :viewer_can_edit, non_null(:boolean), resolve: &ContentFields.viewer_can_edit/3

    field :viewer_can_remove, non_null(:boolean), resolve: &ContentFields.viewer_can_remove/3

    field :accepted_answer_id, :id do
      resolve(fn question, _, _ ->
        accepted_answer =
          cond do
            Ecto.assoc_loaded?(question.accepted_post) ->
              question.accepted_post

            Ecto.assoc_loaded?(question.posts) ->
              Enum.find(question.posts, &(&1.id == question.accepted_post_id))

            true ->
              nil
          end

        GlobalId.encode_optional(
          :product_answer,
          accepted_answer && accepted_answer.entropy_id
        )
      end)
    end

    connection field :answers, node_type: :product_answer, non_null_connection: true do
      resolve(&Reads.answers/3)
    end

    field :created_at, non_null(:datetime),
      resolve: fn question, _, _ -> {:ok, question.inserted_at} end
  end

  connection(node_type: :product_question, non_null_edges: true, non_null_edge: true)

  object :product_answer do
    field :id, non_null(:id) do
      resolve(fn answer, _, _ -> GlobalId.encode_required(:product_answer, answer.entropy_id) end)
    end

    field :body, non_null(:string), resolve: &ContentFields.body/3
    field :moderation_status, non_null(:community_moderation_status)
    field :author_label, non_null(:string), resolve: &ContentFields.author_label/3
    field :viewer_can_edit, non_null(:boolean), resolve: &ContentFields.viewer_can_edit/3

    field :viewer_can_remove, non_null(:boolean), resolve: &ContentFields.viewer_can_remove/3

    field :created_at, non_null(:datetime),
      resolve: fn answer, _, _ -> {:ok, answer.inserted_at} end
  end

  connection(node_type: :product_answer, non_null_edges: true, non_null_edge: true)
end

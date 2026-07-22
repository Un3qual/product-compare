defmodule ProductCompareWeb.Schema.Types.Trust do
  use Absinthe.Schema.Notation

  alias ProductCompareWeb.GraphQL.GlobalId
  alias ProductCompareWeb.Resolvers.DiscussionsResolver
  alias ProductCompareWeb.Resolvers.SpecsResolver

  input_object :specification_correction_value_input do
    field :value_bool, :boolean
    field :value_int, :integer
    field :value_num, :decimal
    field :value_text, :string
    field :value_date, :date
    field :value_timestamp, :datetime
    field :unit_id, :id
    field :enum_option_id, :id
  end

  input_object :propose_specification_correction_input do
    field :product_id, non_null(:id)
    field :attribute_id, non_null(:id)
    field :value, non_null(:specification_correction_value_input)
    field :reason, non_null(:string)
    field :source_url, :string
    field :explanation, :string
  end

  input_object :moderate_specification_correction_input do
    field :id, non_null(:id)
    field :decision, non_null(:specification_correction_status)
    field :moderation_note, :string
  end

  enum :price_watch_rule_type do
    value(:target_price)
    value(:percentage_drop)
    value(:back_in_stock)
    value(:newly_available)
  end

  input_object :create_price_watch_input do
    field :product_id, non_null(:id)
    field :merchant_product_id, :id
    field :rule_type, non_null(:price_watch_rule_type)
    field :currency, non_null(:string)
    field :target_amount, :decimal
    field :percentage_drop, :decimal
    field :cooldown_seconds, :integer
  end

  input_object :update_price_watch_input do
    field :id, non_null(:id)
    field :target_amount, :decimal
    field :percentage_drop, :decimal
    field :enabled, :boolean
    field :cooldown_seconds, :integer
  end

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

  object :specification_correction_payload do
    field :correction, :specification_correction
    field :errors, non_null(list_of(non_null(:mutation_error)))
  end

  object :price_watch_payload do
    field :watch, :price_watch
    field :errors, non_null(list_of(non_null(:mutation_error)))
  end

  object :delete_price_watch_payload do
    field :deleted_watch_id, :id
    field :errors, non_null(list_of(non_null(:mutation_error)))
  end

  object :alert_event_payload do
    field :event, :alert_event
    field :errors, non_null(list_of(non_null(:mutation_error)))
  end

  object :source_artifact do
    interface(:node)

    field :id, non_null(:id) do
      resolve(fn artifact, _, _ -> GlobalId.encode_required(:source_artifact, artifact.id) end)
    end

    field :source_kind, non_null(:string) do
      resolve(fn %{source: %{kind: kind}}, _, _ -> {:ok, kind} end)
    end

    field :source_name, non_null(:string) do
      resolve(fn %{source: %{name: name}}, _, _ -> {:ok, name} end)
    end

    field :source_domain, :string do
      resolve(fn %{source: source}, _, _ -> {:ok, source.domain} end)
    end

    field :url, :string
    field :fetched_at, non_null(:datetime)
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
    field :body, :string, resolve: &DiscussionsResolver.body/3
    field :verified_purchase, non_null(:boolean)
    field :moderation_status, non_null(:community_moderation_status)
    field :author_label, non_null(:string), resolve: &DiscussionsResolver.author_label/3
    field :viewer_can_edit, non_null(:boolean), resolve: &DiscussionsResolver.viewer_can_edit/3

    field :viewer_can_remove, non_null(:boolean),
      resolve: &DiscussionsResolver.viewer_can_remove/3

    field :created_at, non_null(:datetime),
      resolve: fn review, _, _ -> {:ok, review.inserted_at} end
  end

  object :product_review_connection do
    field :edges, non_null(list_of(non_null(:product_review_edge)))
    field :page_info, non_null(:page_info)
  end

  object :product_review_edge do
    field :cursor, non_null(:string)
    field :node, non_null(:product_review)
  end

  object :product_question do
    field :id, non_null(:id) do
      resolve(fn question, _, _ ->
        GlobalId.encode_required(:product_question, question.entropy_id)
      end)
    end

    field :title, non_null(:string)
    field :body, :string, resolve: &DiscussionsResolver.body/3
    field :moderation_status, non_null(:community_moderation_status)
    field :author_label, non_null(:string), resolve: &DiscussionsResolver.author_label/3
    field :viewer_can_edit, non_null(:boolean), resolve: &DiscussionsResolver.viewer_can_edit/3

    field :viewer_can_remove, non_null(:boolean),
      resolve: &DiscussionsResolver.viewer_can_remove/3

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

    field :answers, non_null(:product_answer_connection) do
      arg(:first, :integer)
      arg(:after, :string)
      resolve(&DiscussionsResolver.answers/3)
    end

    field :created_at, non_null(:datetime),
      resolve: fn question, _, _ -> {:ok, question.inserted_at} end
  end

  object :product_question_connection do
    field :edges, non_null(list_of(non_null(:product_question_edge)))
    field :page_info, non_null(:page_info)
  end

  object :product_question_edge do
    field :cursor, non_null(:string)
    field :node, non_null(:product_question)
  end

  object :product_answer do
    field :id, non_null(:id) do
      resolve(fn answer, _, _ -> GlobalId.encode_required(:product_answer, answer.entropy_id) end)
    end

    field :body, non_null(:string), resolve: &DiscussionsResolver.body/3
    field :moderation_status, non_null(:community_moderation_status)
    field :author_label, non_null(:string), resolve: &DiscussionsResolver.author_label/3
    field :viewer_can_edit, non_null(:boolean), resolve: &DiscussionsResolver.viewer_can_edit/3

    field :viewer_can_remove, non_null(:boolean),
      resolve: &DiscussionsResolver.viewer_can_remove/3

    field :created_at, non_null(:datetime),
      resolve: fn answer, _, _ -> {:ok, answer.inserted_at} end
  end

  object :product_answer_connection do
    field :edges, non_null(list_of(non_null(:product_answer_edge)))
    field :page_info, non_null(:page_info)
  end

  object :product_answer_edge do
    field :cursor, non_null(:string)
    field :node, non_null(:product_answer)
  end

  enum :specification_correction_status do
    value(:pending)
    value(:accepted)
    value(:rejected)
  end

  object :specification_correction do
    field :id, non_null(:id) do
      resolve(fn correction, _, _ ->
        GlobalId.encode_required(:specification_correction, correction.id)
      end)
    end

    field :product_id, non_null(:id) do
      resolve(fn correction, _, _ ->
        GlobalId.encode_required(:product, correction.product_id)
      end)
    end

    field :attribute_id, non_null(:id) do
      resolve(fn correction, _, _ ->
        GlobalId.encode_required(:attribute, correction.attribute_id)
      end)
    end

    field :claim_id, non_null(:id) do
      resolve(fn correction, _, _ ->
        GlobalId.encode_required(:product_attribute_claim, correction.claim_id)
      end)
    end

    field :status, non_null(:specification_correction_status)
    field :reason, non_null(:string)
    field :source_url, :string
    field :explanation, :string
    field :value_text, non_null(:string), resolve: &SpecsResolver.correction_value_text/3
    field :moderation_note, :string, resolve: &SpecsResolver.moderation_note/3

    field :submitted_at, non_null(:datetime),
      resolve: fn correction, _, _ -> {:ok, correction.inserted_at} end

    field :reviewed_at, :datetime
  end

  object :specification_correction_connection do
    field :edges, non_null(list_of(non_null(:specification_correction_edge)))
    field :page_info, non_null(:page_info)
  end

  object :specification_correction_edge do
    field :cursor, non_null(:string)
    field :node, non_null(:specification_correction)
  end

  object :price_watch do
    field :id, non_null(:id) do
      resolve(fn watch, _, _ -> GlobalId.encode_required(:price_watch, watch.entropy_id) end)
    end

    field :product_id, non_null(:id) do
      resolve(fn watch, _, _ -> GlobalId.encode_required(:product, watch.product_id) end)
    end

    field :merchant_product_id, :id do
      resolve(fn watch, _, _ ->
        GlobalId.encode_optional(:merchant_product, watch.merchant_product_id)
      end)
    end

    field :product_name, non_null(:string),
      resolve: fn watch, _, _ -> {:ok, watch.product.name} end

    field :product_slug, non_null(:string),
      resolve: fn watch, _, _ -> {:ok, watch.product.slug} end

    field :merchant_name, :string,
      resolve: fn watch, _, _ ->
        {:ok, watch.merchant_product && watch.merchant_product.merchant.name}
      end

    field :rule_type, non_null(:price_watch_rule_type)
    field :currency, non_null(:string)
    field :target_amount, :decimal
    field :percentage_drop, :decimal
    field :baseline_landed_price, :decimal
    field :enabled, non_null(:boolean)
    field :cooldown_seconds, non_null(:integer)
    field :last_evaluated_at, :datetime

    field :created_at, non_null(:datetime),
      resolve: fn watch, _, _ -> {:ok, watch.inserted_at} end
  end

  object :price_watch_connection do
    field :edges, non_null(list_of(non_null(:price_watch_edge)))
    field :page_info, non_null(:page_info)
  end

  object :price_watch_edge do
    field :cursor, non_null(:string)
    field :node, non_null(:price_watch)
  end

  object :alert_event do
    field :id, non_null(:id) do
      resolve(fn event, _, _ -> GlobalId.encode_required(:alert_event, event.entropy_id) end)
    end

    field :rule_type, non_null(:price_watch_rule_type)
    field :currency, non_null(:string)
    field :item_price, non_null(:decimal)
    field :shipping, non_null(:decimal)
    field :landed_price, non_null(:decimal)
    field :observed_at, non_null(:datetime)
    field :read_at, :datetime

    field :created_at, non_null(:datetime),
      resolve: fn event, _, _ -> {:ok, event.inserted_at} end

    field :triggering_price_point_id, non_null(:id) do
      resolve(fn event, _, _ ->
        GlobalId.encode_required(:price_point, event.triggering_price_point_id)
      end)
    end

    field :merchant_product_id, non_null(:id) do
      resolve(fn event, _, _ ->
        GlobalId.encode_required(:merchant_product, event.merchant_product_id)
      end)
    end

    field :product_name, non_null(:string),
      resolve: fn event, _, _ -> {:ok, event.merchant_product.product.name} end

    field :product_slug, non_null(:string),
      resolve: fn event, _, _ -> {:ok, event.merchant_product.product.slug} end

    field :merchant_name, non_null(:string),
      resolve: fn event, _, _ -> {:ok, event.merchant_product.merchant.name} end
  end

  object :alert_event_connection do
    field :edges, non_null(list_of(non_null(:alert_event_edge)))
    field :page_info, non_null(:page_info)
  end

  object :alert_event_edge do
    field :cursor, non_null(:string)
    field :node, non_null(:alert_event)
  end

  object :product_attribute_evidence do
    field :excerpt, :string
    field :source_artifact, non_null(:source_artifact)
  end
end

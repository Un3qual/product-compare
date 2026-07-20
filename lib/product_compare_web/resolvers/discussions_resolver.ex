defmodule ProductCompareWeb.Resolvers.DiscussionsResolver do
  @moduledoc false

  alias ProductCompare.Discussions
  alias ProductCompare.Repo
  alias ProductCompareWeb.GraphQL.Connection
  alias ProductCompareWeb.GraphQL.Errors, as: GraphQLErrors
  alias ProductCompareWeb.GraphQL.GlobalId
  alias ProductCompareWeb.GraphQL.Input

  def review_summary(product, _args, _resolution),
    do: {:ok, Discussions.review_summary(product.id)}

  def reviews(product, args, _resolution) do
    product.id
    |> Discussions.public_reviews_query()
    |> Connection.from_query_result(Input.connection_args(args), Repo)
  end

  def questions(product, args, _resolution) do
    product.id
    |> Discussions.public_questions_query()
    |> Connection.from_query_result(Input.connection_args(args), Repo)
  end

  def answers(question, args, _resolution) do
    question.id
    |> Discussions.public_answers_query()
    |> Connection.from_query_result(Input.connection_args(args), Repo)
  end

  def question(_parent, %{id: id}, _resolution) do
    with {:ok, entropy_id} <- GlobalId.decode_uuid(id, :product_question) do
      {:ok, Discussions.get_public_question(entropy_id)}
    else
      :error -> {:error, "invalid product question id"}
    end
  end

  def submit_review(_parent, %{input: input}, %{context: %{current_user: user}}) do
    with {:ok, product_id} <- decode_id(input, :product_id, :product, "productId"),
         {:ok, merchant_product_id} <-
           decode_optional_id(input, :merchant_product_id, :merchant_product, "merchantProductId"),
         {:ok, review} <-
           Discussions.submit_review(
             user.id,
             product_id,
             %{
               rating: Input.fetch_value(input, :rating),
               title: Input.fetch_value(input, :title),
               body: Input.fetch_value(input, :body),
               merchant_product_id: merchant_product_id
             },
             Input.fetch_value(input, :idempotency_key)
           ) do
      {:ok, %{review: review, errors: []}}
    else
      error -> {:ok, review_error(error)}
    end
  end

  def submit_review(_parent, _args, _resolution), do: {:ok, review_error(:unauthenticated)}

  def ask_question(_parent, %{input: input}, %{context: %{current_user: user}}) do
    with {:ok, product_id} <- decode_id(input, :product_id, :product, "productId"),
         {:ok, question} <-
           Discussions.ask_question(
             user.id,
             product_id,
             %{
               title: Input.fetch_value(input, :title),
               body: Input.fetch_value(input, :body)
             },
             Input.fetch_value(input, :idempotency_key)
           ) do
      {:ok, %{question: question, errors: []}}
    else
      error -> {:ok, question_error(error)}
    end
  end

  def ask_question(_parent, _args, _resolution), do: {:ok, question_error(:unauthenticated)}

  def answer_question(_parent, %{input: input}, %{context: %{current_user: user}}) do
    with {:ok, question_id} <- decode_uuid(input, :question_id, :product_question, "questionId"),
         {:ok, answer} <-
           Discussions.answer_question(
             user.id,
             question_id,
             Input.fetch_value(input, :body),
             Input.fetch_value(input, :idempotency_key)
           ) do
      {:ok, %{answer: answer, errors: []}}
    else
      error -> {:ok, answer_error(error)}
    end
  end

  def answer_question(_parent, _args, _resolution), do: {:ok, answer_error(:unauthenticated)}

  def update_review(_parent, args, resolution),
    do: update_owned_content(:review, :product_review, [:rating, :title, :body], args, resolution)

  def update_question(_parent, args, resolution),
    do: update_owned_content(:question, :product_question, [:title, :body], args, resolution)

  def update_answer(_parent, args, resolution),
    do: update_owned_content(:answer, :product_answer, [:body], args, resolution)

  def remove(_parent, args, resolution), do: content_action(:remove, args, resolution)

  def accept_answer(_parent, %{question_id: question_id, answer_id: answer_id}, %{
        context: %{current_user: user}
      }) do
    with {:ok, question_entropy_id} <- GlobalId.decode_uuid(question_id, :product_question),
         {:ok, answer_entropy_id} <- GlobalId.decode_uuid(answer_id, :product_answer),
         {:ok, question} <-
           Discussions.accept_answer(user.id, question_entropy_id, answer_entropy_id) do
      {:ok, %{question: question, errors: []}}
    else
      error -> {:ok, question_error(error)}
    end
  end

  def accept_answer(_parent, _args, _resolution), do: {:ok, question_error(:unauthenticated)}

  def report(_parent, args, resolution), do: content_action(:report, args, resolution)

  def moderate(_parent, %{input: input}, %{context: %{current_user: user}}) do
    type = Input.fetch_value(input, :content_type)

    with {:ok, entropy_id} <- decode_content_id(Input.fetch_value(input, :content_id), type),
         {:ok, content} <-
           Discussions.moderate(
             user.id,
             type,
             entropy_id,
             Input.fetch_value(input, :status),
             Input.fetch_value(input, :note)
           ) do
      {:ok,
       %{
         content_id: GlobalId.encode(content_id_type(type), content.entropy_id),
         moderation_status: content.moderation_status,
         errors: []
       }}
    else
      error -> {:ok, moderation_error(error)}
    end
  end

  def moderate(_parent, _args, _resolution), do: {:ok, moderation_error(:unauthenticated)}

  def body(content, _args, _resolution), do: {:ok, content.body_md}
  def author_label(_content, _args, _resolution), do: {:ok, "Community member"}

  def viewer_can_edit(content, _args, resolution),
    do: {:ok, viewer_can_manage?(content, resolution)}

  def viewer_can_remove(content, _args, resolution),
    do: {:ok, viewer_can_manage?(content, resolution)}

  defp decode_id(input, field, type, label) do
    Input.decode_required_integer_id(Input.fetch_value(input, field), type, label)
  end

  defp decode_optional_id(input, field, type, label) do
    Input.decode_optional_integer_id(Input.fetch_value(input, field), type, label)
  end

  defp decode_uuid(input, field, type, label) do
    Input.decode_required_uuid_id(Input.fetch_value(input, field), type, label)
  end

  defp decode_content_id(id, type), do: GlobalId.decode_uuid(id, content_id_type(type))
  defp content_id_type(:review), do: :product_review
  defp content_id_type(:question), do: :product_question
  defp content_id_type(:answer), do: :product_answer

  defp review_error(error), do: %{review: nil, errors: errors(error)}
  defp question_error(error), do: %{question: nil, errors: errors(error)}
  defp answer_error(error), do: %{answer: nil, errors: errors(error)}
  defp action_error(error), do: %{report_id: nil, errors: errors(error)}
  defp removal_error(error), do: %{removed_content_id: nil, errors: errors(error)}

  defp moderation_error(error),
    do: %{content_id: nil, moderation_status: nil, errors: errors(error)}

  defp errors(:unauthenticated), do: [GraphQLErrors.unauthenticated_mutation_error()]

  defp errors({:error, %Ecto.Changeset{} = changeset}),
    do: GraphQLErrors.changeset_mutation_errors(changeset)

  defp errors({:error, message}) when is_binary(message),
    do: [GraphQLErrors.mutation_error("INVALID_ID", message)]

  defp errors({:error, :forbidden}), do: [GraphQLErrors.mutation_error("FORBIDDEN", "forbidden")]

  defp errors({:error, :already_reported}),
    do: [GraphQLErrors.mutation_error("ALREADY_REPORTED", "content already reported")]

  defp errors({:error, :answer_not_published}),
    do: [GraphQLErrors.mutation_error("NOT_PUBLISHED", "answer is not published")]

  defp errors({:error, :not_found}),
    do: [GraphQLErrors.mutation_error("NOT_FOUND", "community content not found")]

  defp errors({:error, :idempotency_conflict}),
    do: [GraphQLErrors.community_write_error(:idempotency_conflict)]

  defp errors({:error, :rate_limited}),
    do: [GraphQLErrors.community_write_error(:rate_limited)]

  defp errors({:error, :invalid_lifecycle}),
    do: [GraphQLErrors.community_write_error(:invalid_lifecycle)]

  defp errors({:error, :invalid_argument}),
    do: [GraphQLErrors.mutation_error("INVALID_ARGUMENT", "invalid community content input")]

  defp errors(:error), do: [GraphQLErrors.mutation_error("INVALID_ID", "invalid content id")]

  defp viewer_can_manage?(content, %{context: %{current_user: %{id: user_id}}}) do
    content.moderation_status != :removed and content_owner_id(content) == user_id
  end

  defp viewer_can_manage?(_content, _resolution), do: false

  defp content_owner_id(%{user_id: user_id}) when is_integer(user_id), do: user_id
  defp content_owner_id(%{created_by: user_id}) when is_integer(user_id), do: user_id
  defp content_owner_id(_content), do: nil

  defp update_attrs(input, fields) do
    Enum.reduce(fields, %{}, fn field, attrs ->
      if Map.has_key?(input, field) or Map.has_key?(input, Atom.to_string(field)),
        do: Map.put(attrs, field, Input.fetch_value(input, field)),
        else: attrs
    end)
  end

  defp update_owned_content(
         content_type,
         id_type,
         fields,
         %{input: input},
         %{context: %{current_user: user}}
       ) do
    with {:ok, entropy_id} <- decode_uuid(input, :id, id_type, "id"),
         {:ok, content} <-
           Discussions.update_owned(
             user.id,
             content_type,
             entropy_id,
             update_attrs(input, fields)
           ) do
      {:ok, Map.merge(%{errors: []}, %{content_type => content})}
    else
      error -> {:ok, content_error(content_type, error)}
    end
  end

  defp update_owned_content(content_type, _id_type, _fields, _args, _resolution),
    do: {:ok, content_error(content_type, :unauthenticated)}

  defp content_error(content_type, error), do: %{content_type => nil, errors: errors(error)}

  defp content_action(action, %{input: input}, %{context: %{current_user: user}}) do
    type = Input.fetch_value(input, :content_type)

    with {:ok, entropy_id} <- decode_content_id(Input.fetch_value(input, :content_id), type),
         {:ok, result} <- perform_content_action(action, user.id, type, entropy_id, input) do
      {:ok, content_action_success(action, type, entropy_id, result)}
    else
      error -> {:ok, content_action_error(action, error)}
    end
  end

  defp content_action(action, _args, _resolution),
    do: {:ok, content_action_error(action, :unauthenticated)}

  defp perform_content_action(:remove, user_id, type, entropy_id, _input),
    do: Discussions.remove_owned(user_id, type, entropy_id)

  defp perform_content_action(:report, user_id, type, entropy_id, input),
    do: Discussions.report(user_id, type, entropy_id, Input.fetch_value(input, :reason))

  defp content_action_success(:remove, type, entropy_id, _content),
    do: %{removed_content_id: GlobalId.encode(content_id_type(type), entropy_id), errors: []}

  defp content_action_success(:report, _type, _entropy_id, report),
    do: %{report_id: GlobalId.encode(:community_report, report.id), errors: []}

  defp content_action_error(:remove, error), do: removal_error(error)
  defp content_action_error(:report, error), do: action_error(error)
end

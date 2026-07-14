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
           Discussions.submit_review(user.id, product_id, %{
             rating: Input.fetch_value(input, :rating),
             title: Input.fetch_value(input, :title),
             body: Input.fetch_value(input, :body),
             merchant_product_id: merchant_product_id
           }) do
      {:ok, %{review: review, errors: []}}
    else
      error -> {:ok, review_error(error)}
    end
  end

  def submit_review(_parent, _args, _resolution), do: {:ok, review_error(:unauthenticated)}

  def ask_question(_parent, %{input: input}, %{context: %{current_user: user}}) do
    with {:ok, product_id} <- decode_id(input, :product_id, :product, "productId"),
         {:ok, question} <-
           Discussions.ask_question(user.id, product_id, %{
             title: Input.fetch_value(input, :title),
             body: Input.fetch_value(input, :body)
           }) do
      {:ok, %{question: question, errors: []}}
    else
      error -> {:ok, question_error(error)}
    end
  end

  def ask_question(_parent, _args, _resolution), do: {:ok, question_error(:unauthenticated)}

  def answer_question(_parent, %{input: input}, %{context: %{current_user: user}}) do
    with {:ok, question_id} <- decode_uuid(input, :question_id, :product_question, "questionId"),
         {:ok, answer} <-
           Discussions.answer_question(user.id, question_id, Input.fetch_value(input, :body)) do
      {:ok, %{answer: answer, errors: []}}
    else
      error -> {:ok, answer_error(error)}
    end
  end

  def answer_question(_parent, _args, _resolution), do: {:ok, answer_error(:unauthenticated)}

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

  def report(_parent, %{input: input}, %{context: %{current_user: user}}) do
    type = Input.fetch_value(input, :content_type)

    with {:ok, entropy_id} <- decode_content_id(Input.fetch_value(input, :content_id), type),
         {:ok, report} <-
           Discussions.report(user.id, type, entropy_id, Input.fetch_value(input, :reason)) do
      {:ok,
       %{
         report_id: GlobalId.encode(:community_report, report.id),
         errors: []
       }}
    else
      error -> {:ok, action_error(error)}
    end
  end

  def report(_parent, _args, _resolution), do: {:ok, action_error(:unauthenticated)}

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

  defp errors(:error), do: [GraphQLErrors.mutation_error("INVALID_ID", "invalid content id")]
end

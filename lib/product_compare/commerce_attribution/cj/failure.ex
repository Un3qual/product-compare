defmodule ProductCompare.CommerceAttribution.CJ.Failure do
  @moduledoc false

  @categories [
    :authentication_error,
    :authorization_error,
    :configuration_error,
    :decode_error,
    :graphql_error,
    :http_error,
    :invalid_request,
    :invalid_response,
    :page_ceiling_exhausted,
    :persistence_validation_failed,
    :provider_failure,
    :runner_exception,
    :transient_provider_failure,
    :unexpected_importer_result,
    :unmatched_correction
  ]

  @spec category(term()) :: atom()
  def category(category) when category in @categories, do: category
  def category({:missing_env, _name}), do: :configuration_error
  def category({:missing_affiliate_network, _network}), do: :configuration_error

  def category(reason) when reason in [:credentials_missing, :missing_credentials],
    do: :configuration_error

  def category({:authentication_failed, _reason}), do: :authentication_error
  def category({:authorization_failed, _reason}), do: :authorization_error
  def category({:http_error, 401}), do: :authentication_error
  def category({:http_error, 403}), do: :authorization_error
  def category({:graphql_error, "UNAUTHENTICATED"}), do: :authentication_error
  def category({:graphql_error, "FORBIDDEN"}), do: :authorization_error
  def category({:invalid_request, _field}), do: :invalid_request
  def category({:invalid_response, _category}), do: :invalid_response
  def category({:decode_error, _category}), do: :decode_error
  def category({:graphql_error, _code}), do: :graphql_error
  def category({:transport_error, _reason}), do: :transient_provider_failure

  def category({:http_error, status}) when status in [408, 429],
    do: :transient_provider_failure

  def category({:http_error, status}) when is_integer(status) and status in 500..599,
    do: :transient_provider_failure

  def category({:http_error, _status}), do: :http_error
  def category(%Ecto.Changeset{}), do: :persistence_validation_failed
  def category(_reason), do: :provider_failure

  @spec retryable?(term()) :: boolean()
  def retryable?(reason),
    do: category(reason) in [:runner_exception, :transient_provider_failure]
end

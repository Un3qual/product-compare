defmodule ProductCompare.Accounts.Users do
  @moduledoc false

  @dialyzer {:nowarn_function, blank_password?: 1}

  import Ecto.Query

  alias ProductCompare.Accounts.Reputation
  alias ProductCompare.Repo
  alias ProductCompareSchemas.Accounts.User
  alias ProductCompareSchemas.Accounts.UserReputation

  @accounts_context ProductCompare.Accounts
  @ensure_user_with_password_before_create_hook :ensure_user_with_password_before_create
  @bootstrap_operator_before_create_hook :bootstrap_operator_before_create

  @spec create_user(map()) :: {:ok, User.t()} | {:error, Ecto.Changeset.t()}
  def create_user(attrs) do
    if password_provided?(attrs) do
      %User{}
      |> User.registration_changeset(attrs)
      |> insert_user()
    else
      attrs = ensure_hashed_password(attrs)

      %User{}
      |> User.changeset(attrs)
      |> insert_user()
    end
  end

  @spec register_user(map()) :: {:ok, User.t()} | {:error, Ecto.Changeset.t()}
  def register_user(attrs) do
    %User{}
    |> User.registration_changeset(attrs)
    |> Repo.insert()
  end

  @spec get_user!(pos_integer()) :: User.t()
  def get_user!(id), do: Repo.get!(User, id)

  @spec get_user_by_email(String.t()) :: User.t() | nil
  def get_user_by_email(email), do: Repo.get_by(User, email: normalize_email(email))

  @spec set_operator_access(User.t(), boolean()) ::
          {:ok, User.t()} | {:error, Ecto.Changeset.t()}
  def set_operator_access(%User{} = user, is_operator) when is_boolean(is_operator) do
    user
    |> User.operator_access_changeset(is_operator)
    |> Repo.update()
  end

  @spec bootstrap_operator_user(String.t(), String.t(), integer()) ::
          {:ok, User.t()} | {:error, :existing_non_operator | Ecto.Changeset.t()}
  def bootstrap_operator_user(email, password, reputation_points)
      when is_binary(email) and is_binary(password) and is_integer(reputation_points) do
    normalized_email = normalize_email(email)

    case Repo.transaction(fn ->
           bootstrap_operator_user_transaction(normalized_email, password, reputation_points)
         end) do
      {:ok, %User{} = user} -> {:ok, user}
      {:error, :existing_non_operator} -> {:error, :existing_non_operator}
      {:error, %Ecto.Changeset{} = changeset} -> {:error, changeset}
    end
  end

  @spec ensure_user_with_password(String.t(), String.t()) ::
          {:ok, User.t()} | {:error, Ecto.Changeset.t()}
  def ensure_user_with_password(email, password) when is_binary(email) and is_binary(password) do
    normalized_email = normalize_email(email)

    if blank_password?(password) do
      {:error,
       User.registration_changeset(%User{}, %{email: normalized_email, password: password})}
    else
      case Repo.transaction(fn ->
             ensure_user_with_password_transaction(normalized_email, password)
           end) do
        {:ok, %User{} = user} ->
          {:ok, user}

        {:error, %Ecto.Changeset{} = changeset} ->
          {:error, changeset}
      end
    end
  end

  defp bootstrap_operator_user_transaction(normalized_email, password, reputation_points) do
    case lock_user_by_email(normalized_email) do
      %User{is_operator: true} = operator ->
        operator

      %User{} ->
        Repo.rollback(:existing_non_operator)

      nil ->
        run_before_user_create_hook(@bootstrap_operator_before_create_hook, normalized_email)

        %User{}
        |> User.registration_changeset(%{email: normalized_email, password: password})
        |> Repo.insert(on_conflict: :nothing, conflict_target: [:email], returning: true)
        |> finish_operator_bootstrap(normalized_email, reputation_points)
    end
  end

  defp finish_operator_bootstrap({:ok, %User{id: nil}}, normalized_email, _reputation_points) do
    case lock_user_by_email(normalized_email) do
      %User{is_operator: true} = operator -> operator
      %User{} -> Repo.rollback(:existing_non_operator)
      nil -> Repo.rollback(:existing_non_operator)
    end
  end

  defp finish_operator_bootstrap(
         {:ok, %User{} = user},
         _normalized_email,
         reputation_points
       ) do
    with {:ok, %User{} = operator} <- set_operator_access(user, true),
         {:ok, %UserReputation{}} <-
           Reputation.upsert_user_reputation(operator.id, reputation_points) do
      operator
    else
      {:error, %Ecto.Changeset{} = changeset} -> Repo.rollback(changeset)
    end
  end

  defp finish_operator_bootstrap(
         {:error, %Ecto.Changeset{} = changeset},
         _normalized_email,
         _reputation_points
       ) do
    Repo.rollback(changeset)
  end

  defp ensure_user_with_password_transaction(normalized_email, password) do
    case lock_user_by_email(normalized_email) do
      nil ->
        run_before_user_create_hook(
          @ensure_user_with_password_before_create_hook,
          normalized_email
        )

        case create_user(%{email: normalized_email, password: password}) do
          {:ok, %User{} = user} ->
            user

          {:error, %Ecto.Changeset{} = changeset} ->
            if unique_email_error?(changeset) do
              normalized_email
              |> lock_user_by_email()
              |> ensure_user_password_hash(normalized_email, password)
            else
              Repo.rollback(changeset)
            end
        end

      %User{} = user ->
        ensure_user_password_hash(user, normalized_email, password)
    end
  end

  defp ensure_user_password_hash(nil, normalized_email, password) do
    case create_user(%{email: normalized_email, password: password}) do
      {:ok, %User{} = user} -> user
      {:error, %Ecto.Changeset{} = changeset} -> Repo.rollback(changeset)
    end
  end

  defp ensure_user_password_hash(%User{} = user, normalized_email, password) do
    if user_missing_password_hash?(user) do
      case user
           |> User.registration_changeset(%{email: normalized_email, password: password})
           |> Repo.update() do
        {:ok, %User{} = repaired_user} ->
          repaired_user

        {:error, %Ecto.Changeset{} = changeset} ->
          Repo.rollback(changeset)
      end
    else
      user
    end
  end

  defp lock_user_by_email(email) do
    Repo.one(
      from user in User,
        where: user.email == ^email,
        lock: "FOR UPDATE"
    )
  end

  defp unique_email_error?(%Ecto.Changeset{} = changeset) do
    Enum.any?(changeset.errors, fn
      {:email, {_message, options}} -> options[:constraint] == :unique
      _other -> false
    end)
  end

  defp normalize_email(email) when is_binary(email), do: User.normalize_email(email)

  defp normalize_email(email) do
    email
    |> to_string()
    |> User.normalize_email()
  end

  defp run_before_user_create_hook(hook_key, email) do
    case Application.get_env(:product_compare, @accounts_context, [])
         |> Keyword.get(hook_key) do
      fun when is_function(fun, 1) -> fun.(email)
      _other -> :ok
    end
  end

  defp user_missing_password_hash?(%User{hashed_password: hashed_password}) do
    is_nil(hashed_password) or hashed_password == "" or
      not String.starts_with?(hashed_password, "$argon2")
  end

  defp ensure_hashed_password(attrs) when is_map(attrs) do
    case Map.get(attrs, :hashed_password, Map.get(attrs, "hashed_password")) do
      hashed_password when is_binary(hashed_password) and hashed_password != "" ->
        attrs

      _ ->
        put_default_hashed_password(attrs)
    end
  end

  defp ensure_hashed_password(_attrs), do: %{hashed_password: default_hashed_password()}

  defp put_default_hashed_password(attrs) do
    if Enum.any?(Map.keys(attrs), &is_binary/1) do
      Map.put(attrs, "hashed_password", default_hashed_password())
    else
      Map.put(attrs, :hashed_password, default_hashed_password())
    end
  end

  defp password_provided?(attrs) when is_map(attrs) do
    match?(
      password when is_binary(password) and password != "",
      Map.get(attrs, :password, Map.get(attrs, "password"))
    )
  end

  defp password_provided?(_attrs), do: false

  defp blank_password?(password) when is_binary(password), do: String.trim(password) == ""
  defp blank_password?(_password), do: true

  defp insert_user(changeset), do: Repo.insert(changeset, transaction_insert_opts())

  defp transaction_insert_opts do
    if Repo.in_transaction?(), do: [mode: :savepoint], else: []
  end

  defp default_hashed_password do
    32
    |> :crypto.strong_rand_bytes()
    |> Base.encode16(case: :lower)
  end
end

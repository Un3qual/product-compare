defmodule ProductCompare.DevSeeds.Accounts do
  @moduledoc false

  import Ecto.Query

  alias ProductCompare.Accounts, as: AccountsContext
  alias ProductCompare.DevSeeds.Support
  alias ProductCompare.Repo
  alias ProductCompareSchemas.Accounts.ApiToken
  alias ProductCompareSchemas.Accounts.User

  @type result :: %{
          admin: User.t(),
          moderator: User.t(),
          shopper: User.t(),
          participant: User.t(),
          unverified: User.t(),
          reset_user: User.t(),
          active_api_token: ApiToken.t(),
          active_plain_text_token: String.t(),
          revoked_api_token: ApiToken.t(),
          confirmation_token: String.t(),
          reset_token: String.t()
        }

  @spec seed!(String.t(), DateTime.t()) :: result()
  def seed!(password, %DateTime{} = anchor) when is_binary(password) do
    admin = bootstrap_operator!("admin@example.com", password, 1_000)
    moderator = bootstrap_operator!("moderator@example.com", password, 500)

    shopper = ensure_regular!("shopper@example.com", password, 100)
    participant = ensure_regular!("participant@example.com", password, 25)
    unverified = ensure_regular!("unverified@example.com", password, 0)
    reset_user = ensure_regular!("reset@example.com", password, 0)

    admin = restore_user!(admin, password, true, anchor)
    moderator = restore_user!(moderator, password, true, anchor)
    shopper = restore_user!(shopper, password, false, anchor)
    participant = restore_user!(participant, password, false, anchor)
    unverified = restore_user!(unverified, password, false, nil)
    reset_user = restore_user!(reset_user, password, false, anchor)

    {revoked_api_token, active_api_token, active_plain_text_token} =
      seed_api_tokens!(shopper)

    confirmation_token =
      Support.capture_token!(fn callback ->
        AccountsContext.deliver_user_confirmation_instructions(unverified, callback)
      end)

    reset_token =
      Support.capture_token!(fn callback ->
        AccountsContext.deliver_user_reset_password_instructions(reset_user, callback)
      end)

    %{
      admin: admin,
      moderator: moderator,
      shopper: shopper,
      participant: participant,
      unverified: unverified,
      reset_user: reset_user,
      active_api_token: active_api_token,
      active_plain_text_token: active_plain_text_token,
      revoked_api_token: revoked_api_token,
      confirmation_token: confirmation_token,
      reset_token: reset_token
    }
  end

  defp bootstrap_operator!(email, password, reputation_points) do
    case AccountsContext.bootstrap_operator_user(email, password, reputation_points) do
      {:ok, user} ->
        AccountsContext.upsert_user_reputation(user.id, reputation_points)
        |> Support.expect!("operator account reputation #{email}")

        user

      {:error, :existing_non_operator} ->
        raise """
        Refusing to bootstrap #{email}: an existing non-operator account already owns this email.
        Resolve the account conflict explicitly before rerunning seeds.
        """

      {:error, %Ecto.Changeset{} = changeset} ->
        raise "Failed to bootstrap #{email}: #{inspect(changeset.errors)}"
    end
  end

  defp ensure_regular!(email, password, reputation_points) do
    user =
      AccountsContext.ensure_user_with_password(email, password)
      |> Support.expect!("regular account #{email}")

    AccountsContext.upsert_user_reputation(user.id, reputation_points)
    |> Support.expect!("regular account reputation #{email}")

    user
  end

  defp restore_user!(user, password, operator?, confirmed_at) do
    user =
      if password_matches?(user, password) do
        user
      else
        user
        |> Repo.reload!()
        |> User.password_changeset(%{password: password})
        |> Repo.update()
        |> Support.expect!("password for #{user.email}")
      end

    user =
      AccountsContext.set_operator_access(user, operator?)
      |> Support.expect!("operator access for #{user.email}")

    user
    |> confirmation_changeset(confirmed_at)
    |> Repo.update()
    |> Support.expect!("confirmation state for #{user.email}")
  end

  defp confirmation_changeset(user, %DateTime{}), do: User.confirm_changeset(user)
  defp confirmation_changeset(user, nil), do: User.changeset(user, %{confirmed_at: nil})

  defp password_matches?(%User{hashed_password: "$argon2" <> _ = hash}, password) do
    Argon2.verify_pass(password, hash)
  rescue
    ArgumentError -> false
  end

  defp password_matches?(%User{}, _password), do: false

  defp seed_api_tokens!(shopper) do
    ApiToken
    |> where(
      [token],
      token.user_id == ^shopper.id and
        token.label in ["Development active", "Development revoked"]
    )
    |> Repo.delete_all()

    %{api_token: token_to_revoke} =
      AccountsContext.create_api_token(shopper.id, %{label: "Development revoked"})
      |> Support.expect!("revoked API token")

    revoked_api_token =
      AccountsContext.revoke_api_token(shopper.id, token_to_revoke.entropy_id)
      |> Support.expect!("revoke API token")

    %{api_token: active_api_token, plain_text_token: active_plain_text_token} =
      AccountsContext.create_api_token(shopper.id, %{label: "Development active"})
      |> Support.expect!("active API token")

    {revoked_api_token, active_api_token, active_plain_text_token}
  end
end

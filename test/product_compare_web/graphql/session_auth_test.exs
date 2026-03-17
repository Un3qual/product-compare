defmodule ProductCompareWeb.GraphQL.SessionAuthTest do
  use ProductCompareWeb.ConnCase, async: false

  alias ProductCompare.Accounts
  import ProductCompare.Fixtures.AccountsFixtures

  setup do
    parent = self()
    endpoint_config = Application.get_env(:product_compare, ProductCompareWeb.Endpoint, [])
    accounts_config = Application.get_env(:product_compare, ProductCompare.Accounts, [])

    Application.put_env(
      :product_compare,
      ProductCompareWeb.Endpoint,
      Keyword.put(endpoint_config, :trusted_origins, ["https://app.example.com"])
    )

    Application.put_env(
      :product_compare,
      ProductCompare.Accounts,
      accounts_config
      |> Keyword.put(:deliver_user_confirmation_instructions, fn user, token ->
        send(parent, {:confirmation_token, user.email, token})
      end)
      |> Keyword.put(:deliver_user_reset_password_instructions, fn user, token ->
        send(parent, {:reset_password_token, user.email, token})
      end)
    )

    on_exit(fn ->
      Application.put_env(:product_compare, ProductCompareWeb.Endpoint, endpoint_config)
      Application.put_env(:product_compare, ProductCompare.Accounts, accounts_config)
    end)

    :ok
  end

  test "viewer resolves from session without bearer token", %{conn: conn} do
    user = user_fixture(%{password: "supersecretpass123"})
    user_email = user.email

    conn =
      conn
      |> log_in_user(user)
      |> put_req_header_same_origin()

    query = """
    query {
      viewer {
        email
      }
    }
    """

    assert %{"data" => %{"viewer" => %{"email" => ^user_email}}} = graphql(conn, query)
  end

  test "cross-origin requests do not resolve viewer from the browser session", %{conn: conn} do
    user = user_fixture(%{password: "supersecretpass123"})

    conn =
      conn
      |> log_in_user(user)
      |> put_req_header("origin", "https://evil.example.com")

    query = """
    query {
      viewer {
        email
      }
    }
    """

    assert %{"data" => %{"viewer" => nil}} = graphql(conn, query)
  end

  test "trusted frontend origins can resolve viewer from the browser session", %{conn: conn} do
    user = user_fixture(%{password: "supersecretpass123"})
    user_email = user.email

    conn =
      conn
      |> log_in_user(user)
      |> put_req_header("origin", "https://app.example.com")

    query = """
    query {
      viewer {
        email
      }
    }
    """

    assert %{"data" => %{"viewer" => %{"email" => ^user_email}}} = graphql(conn, query)
  end

  test "register creates a user, sets the session, and returns viewer", %{conn: conn} do
    email = "register-#{System.unique_integer([:positive])}@example.com"
    password = "supersecretpass123"

    conn =
      conn
      |> put_req_header_same_origin()
      |> graphql_request(register_mutation(), %{"email" => email, "password" => password})

    assert %{
             "data" => %{
               "register" => %{
                 "viewer" => %{"email" => ^email},
                 "errors" => []
               }
             }
           } = json_response(conn, 200)

    assert get_session(conn, :user_token)
    assert %{email: ^email} = Accounts.get_user_by_email(email)

    viewer_conn =
      conn
      |> recycle()
      |> put_req_header_same_origin()

    assert %{"data" => %{"viewer" => %{"email" => ^email}}} = graphql(viewer_conn, viewer_query())
  end

  test "register dispatches confirmation instructions when delivery is configured", %{conn: conn} do
    email = "register-confirm-#{System.unique_integer([:positive])}@example.com"

    conn =
      conn
      |> put_req_header_same_origin()
      |> graphql_request(register_mutation(), %{
        "email" => email,
        "password" => "supersecretpass123"
      })

    assert %{
             "data" => %{
               "register" => %{
                 "viewer" => %{"email" => ^email},
                 "errors" => []
               }
             }
           } = json_response(conn, 200)

    assert_receive {:confirmation_token, ^email, token}
    assert is_binary(token)
  end

  test "register returns typed validation errors without creating a session", %{conn: conn} do
    conn =
      conn
      |> put_req_header_same_origin()
      |> graphql_request(register_mutation(), %{"email" => "bad-email", "password" => "short"})

    assert %{
             "data" => %{
               "register" => %{
                 "viewer" => nil,
                 "errors" => errors
               }
             }
           } = json_response(conn, 200)

    assert Enum.any?(errors, &(&1["code"] == "INVALID_ARGUMENT"))
    refute get_session(conn, :user_token)
    assert is_nil(Accounts.get_user_by_email("bad-email"))
  end

  test "login sets the session and returns viewer", %{conn: conn} do
    user = user_fixture(%{password: "supersecretpass123"})
    user_email = user.email

    conn =
      conn
      |> put_req_header_same_origin()
      |> graphql_request(login_mutation(), %{
        "email" => user.email,
        "password" => "supersecretpass123"
      })

    assert %{
             "data" => %{
               "login" => %{
                 "viewer" => %{"email" => ^user_email},
                 "errors" => []
               }
             }
           } = json_response(conn, 200)

    assert get_session(conn, :user_token)
  end

  test "login returns typed credential errors without creating a session", %{conn: conn} do
    user = user_fixture(%{password: "supersecretpass123"})

    conn =
      conn
      |> put_req_header_same_origin()
      |> graphql_request(login_mutation(), %{
        "email" => user.email,
        "password" => "wrong-password-123"
      })

    assert %{
             "data" => %{
               "login" => %{
                 "viewer" => nil,
                 "errors" => [
                   %{
                     "code" => "INVALID_CREDENTIALS",
                     "message" => "invalid email or password",
                     "field" => nil
                   }
                 ]
               }
             }
           } = json_response(conn, 200)

    refute get_session(conn, :user_token)
  end

  test "logout drops the current session and returns ok", %{conn: conn} do
    user = user_fixture(%{password: "supersecretpass123"})

    conn =
      conn
      |> log_in_user(user)
      |> put_req_header_same_origin()
      |> graphql_request(logout_mutation())

    assert %{
             "data" => %{
               "logout" => %{
                 "ok" => true,
                 "errors" => []
               }
             }
           } = json_response(conn, 200)

    assert conn.private[:plug_session_info] == :drop

    viewer_conn =
      conn
      |> recycle()
      |> put_req_header_same_origin()

    assert %{"data" => %{"viewer" => nil}} = graphql(viewer_conn, viewer_query())
  end

  test "untrusted origins cannot use session-writing auth mutations", %{conn: conn} do
    user = user_fixture(%{password: "supersecretpass123"})

    conn =
      conn
      |> put_req_header("origin", "https://evil.example.com")
      |> graphql_request(login_mutation(), %{
        "email" => user.email,
        "password" => "supersecretpass123"
      })

    assert %{
             "data" => %{
               "login" => %{
                 "viewer" => nil,
                 "errors" => [
                   %{
                     "code" => "INVALID_ORIGIN",
                     "message" => "cross-origin request rejected",
                     "field" => nil
                   }
                 ]
               }
             }
           } = json_response(conn, 200)

    refute get_session(conn, :user_token)
  end

  test "forgotPassword returns ok and issues a reset token for an existing user", %{conn: conn} do
    user = user_fixture(%{password: "supersecretpass123"})
    user_email = user.email

    conn =
      conn
      |> put_req_header_same_origin()
      |> graphql_request(forgot_password_mutation(), %{"email" => user.email})

    assert %{
             "data" => %{
               "forgotPassword" => %{
                 "ok" => true,
                 "errors" => []
               }
             }
           } = json_response(conn, 200)

    assert_receive {:reset_password_token, ^user_email, token}
    assert is_binary(token)
  end

  test "forgotPassword does not disclose whether the email exists", %{conn: conn} do
    email = "missing-#{System.unique_integer([:positive])}@example.com"

    conn =
      conn
      |> put_req_header_same_origin()
      |> graphql_request(forgot_password_mutation(), %{"email" => email})

    assert %{
             "data" => %{
               "forgotPassword" => %{
                 "ok" => true,
                 "errors" => []
               }
             }
           } = json_response(conn, 200)

    refute_received {:reset_password_token, ^email, _token}
  end

  test "forgotPassword returns ok and preserves the prior token when delivery raises", %{
    conn: conn
  } do
    user = user_fixture(%{password: "supersecretpass123"})
    user_email = user.email
    accounts_config = Application.get_env(:product_compare, ProductCompare.Accounts, [])

    assert :ok = Accounts.deliver_user_reset_password_instructions(user)
    assert_receive {:reset_password_token, ^user_email, original_token}

    Application.put_env(
      :product_compare,
      ProductCompare.Accounts,
      Keyword.put(accounts_config, :deliver_user_reset_password_instructions, fn _user, _token ->
        raise "mailer down"
      end)
    )

    on_exit(fn ->
      Application.put_env(:product_compare, ProductCompare.Accounts, accounts_config)
    end)

    conn =
      conn
      |> put_req_header_same_origin()
      |> graphql_request(forgot_password_mutation(), %{"email" => user.email})

    assert %{
             "data" => %{
               "forgotPassword" => %{
                 "ok" => true,
                 "errors" => []
               }
             }
           } = json_response(conn, 200)

    assert %ProductCompareSchemas.Accounts.User{id: user_id} = user

    assert %ProductCompareSchemas.Accounts.User{id: ^user_id} =
             Accounts.get_user_by_reset_password_token(original_token)
  end

  test "forgotPassword returns ok and preserves the prior token when delivery returns :error", %{
    conn: conn
  } do
    user = user_fixture(%{password: "supersecretpass123"})
    user_email = user.email
    accounts_config = Application.get_env(:product_compare, ProductCompare.Accounts, [])

    assert :ok = Accounts.deliver_user_reset_password_instructions(user)
    assert_receive {:reset_password_token, ^user_email, original_token}

    Application.put_env(
      :product_compare,
      ProductCompare.Accounts,
      Keyword.put(accounts_config, :deliver_user_reset_password_instructions, fn _user, _token ->
        :error
      end)
    )

    on_exit(fn ->
      Application.put_env(:product_compare, ProductCompare.Accounts, accounts_config)
    end)

    conn =
      conn
      |> put_req_header_same_origin()
      |> graphql_request(forgot_password_mutation(), %{"email" => user.email})

    assert %{
             "data" => %{
               "forgotPassword" => %{
                 "ok" => true,
                 "errors" => []
               }
             }
           } = json_response(conn, 200)

    assert %ProductCompareSchemas.Accounts.User{id: user_id} = user

    assert %ProductCompareSchemas.Accounts.User{id: ^user_id} =
             Accounts.get_user_by_reset_password_token(original_token)
  end

  test "resetPassword updates the password, drops the current session, and returns ok", %{
    conn: conn
  } do
    user = user_fixture(%{password: "supersecretpass123"})
    user_email = user.email

    assert :ok = Accounts.deliver_user_reset_password_instructions(user)
    assert_receive {:reset_password_token, ^user_email, token}

    conn =
      conn
      |> log_in_user(user)
      |> put_req_header_same_origin()
      |> graphql_request(reset_password_mutation(), %{
        "token" => token,
        "password" => "supersecretpass456"
      })

    assert %{
             "data" => %{
               "resetPassword" => %{
                 "ok" => true,
                 "errors" => []
               }
             }
           } = json_response(conn, 200)

    assert conn.private[:plug_session_info] == :drop

    assert is_nil(
             Accounts.authenticate_user_by_email_and_password(user_email, "supersecretpass123")
           )

    assert %ProductCompareSchemas.Accounts.User{} =
             Accounts.authenticate_user_by_email_and_password(user_email, "supersecretpass456")

    viewer_conn =
      conn
      |> recycle()
      |> put_req_header_same_origin()

    assert %{"data" => %{"viewer" => nil}} = graphql(viewer_conn, viewer_query())
  end

  test "resetPassword returns INVALID_TOKEN errors for bad tokens", %{conn: conn} do
    conn =
      conn
      |> put_req_header_same_origin()
      |> graphql_request(reset_password_mutation(), %{
        "token" => "definitely-invalid-token",
        "password" => "supersecretpass456"
      })

    assert %{
             "data" => %{
               "resetPassword" => %{
                 "ok" => false,
                 "errors" => [
                   %{
                     "code" => "INVALID_TOKEN",
                     "message" => "invalid or expired token",
                     "field" => "token"
                   }
                 ]
               }
             }
           } = json_response(conn, 200)
  end

  test "verifyEmail confirms the user and returns ok", %{conn: conn} do
    user = user_fixture(%{password: "supersecretpass123"})
    user_email = user.email

    assert :ok = Accounts.deliver_user_confirmation_instructions(user)
    assert_receive {:confirmation_token, ^user_email, token}

    conn =
      conn
      |> put_req_header_same_origin()
      |> graphql_request(verify_email_mutation(), %{"token" => token})

    assert %{
             "data" => %{
               "verifyEmail" => %{
                 "ok" => true,
                 "errors" => []
               }
             }
           } = json_response(conn, 200)

    refute is_nil(Accounts.get_user!(user.id).confirmed_at)
  end

  test "verifyEmail returns INVALID_TOKEN errors for bad tokens", %{conn: conn} do
    conn =
      conn
      |> put_req_header_same_origin()
      |> graphql_request(verify_email_mutation(), %{"token" => "definitely-invalid-token"})

    assert %{
             "data" => %{
               "verifyEmail" => %{
                 "ok" => false,
                 "errors" => [
                   %{
                     "code" => "INVALID_TOKEN",
                     "message" => "invalid or expired token",
                     "field" => "token"
                   }
                 ]
               }
             }
           } = json_response(conn, 200)
  end

  test "untrusted origins cannot use forgotPassword, resetPassword, or verifyEmail", %{conn: conn} do
    user = user_fixture(%{password: "supersecretpass123"})
    user_email = user.email
    assert :ok = Accounts.deliver_user_reset_password_instructions(user)
    assert_receive {:reset_password_token, ^user_email, reset_token}
    assert :ok = Accounts.deliver_user_confirmation_instructions(user)
    assert_receive {:confirmation_token, ^user_email, confirmation_token}

    for {mutation, variables, field_name} <- [
          {forgot_password_mutation(), %{"email" => user.email}, "forgotPassword"},
          {reset_password_mutation(),
           %{"token" => reset_token, "password" => "supersecretpass456"}, "resetPassword"},
          {verify_email_mutation(), %{"token" => confirmation_token}, "verifyEmail"}
        ] do
      response =
        conn
        |> recycle()
        |> put_req_header("origin", "https://evil.example.com")
        |> graphql_request(mutation, variables)
        |> json_response(200)

      assert %{
               "data" => %{
                 ^field_name => %{
                   "ok" => false,
                   "errors" => [
                     %{
                       "code" => "INVALID_ORIGIN",
                       "message" => "cross-origin request rejected",
                       "field" => nil
                     }
                   ]
                 }
               }
             } = response
    end
  end

  test "stale session tokens are cleared after a lookup miss", %{conn: conn} do
    user = user_fixture(%{password: "supersecretpass123"})

    conn =
      conn
      |> log_in_user(user)
      |> put_req_header_same_origin()

    token = get_session(conn, :user_token)
    assert :ok = ProductCompare.Accounts.delete_user_session_token(token)

    query = """
    query {
      viewer {
        email
      }
    }
    """

    conn = post(conn, "/api/graphql", %{query: query, variables: %{}})

    assert %{"data" => %{"viewer" => nil}} = json_response(conn, 200)
    refute get_session(conn, :user_token)
  end

  test "graphql preflight returns credentialed CORS headers for trusted frontend origins", %{
    conn: conn
  } do
    conn =
      conn
      |> put_req_header("origin", "https://app.example.com")
      |> put_req_header("access-control-request-method", "POST")
      |> put_req_header("access-control-request-headers", "content-type")
      |> options("/api/graphql")

    assert response(conn, 204) == ""
    assert get_resp_header(conn, "access-control-allow-origin") == ["https://app.example.com"]
    assert get_resp_header(conn, "access-control-allow-credentials") == ["true"]

    assert get_resp_header(conn, "access-control-allow-methods") == [
             "GET,POST,PUT,PATCH,DELETE,OPTIONS"
           ]

    assert get_resp_header(conn, "access-control-allow-headers") == ["content-type"]
  end

  test "invalid bearer token does not fall back to session authentication", %{conn: conn} do
    user = user_fixture(%{password: "supersecretpass123"})

    conn =
      conn
      |> log_in_user(user)
      |> put_req_header_same_origin()
      |> put_req_header("authorization", "Bearer definitely-invalid-token")

    query = """
    query {
      viewer {
        email
      }
    }
    """

    conn = post(conn, "/api/graphql", %{query: query, variables: %{}})

    assert %{
             "errors" => [
               %{
                 "code" => "INVALID_API_TOKEN",
                 "message" => "invalid API token"
               }
             ]
           } = json_response(conn, 401)
  end

  defp login_mutation do
    """
    mutation Login($email: String!, $password: String!) {
      login(email: $email, password: $password) {
        viewer {
          email
        }
        errors {
          code
          message
          field
        }
      }
    }
    """
  end

  defp register_mutation do
    """
    mutation Register($email: String!, $password: String!) {
      register(email: $email, password: $password) {
        viewer {
          email
        }
        errors {
          code
          message
          field
        }
      }
    }
    """
  end

  defp logout_mutation do
    """
    mutation Logout {
      logout {
        ok
        errors {
          code
          message
          field
        }
      }
    }
    """
  end

  defp forgot_password_mutation do
    """
    mutation ForgotPassword($email: String!) {
      forgotPassword(email: $email) {
        ok
        errors {
          code
          message
          field
        }
      }
    }
    """
  end

  defp reset_password_mutation do
    """
    mutation ResetPassword($token: String!, $password: String!) {
      resetPassword(token: $token, password: $password) {
        ok
        errors {
          code
          message
          field
        }
      }
    }
    """
  end

  defp verify_email_mutation do
    """
    mutation VerifyEmail($token: String!) {
      verifyEmail(token: $token) {
        ok
        errors {
          code
          message
          field
        }
      }
    }
    """
  end

  defp viewer_query do
    """
    query {
      viewer {
        email
      }
    }
    """
  end

  defp graphql_request(conn, query, variables \\ %{}) do
    post(conn, "/api/graphql", %{query: query, variables: variables})
  end

  defp graphql(conn, query, variables \\ %{}) do
    conn
    |> graphql_request(query, variables)
    |> json_response(200)
  end
end

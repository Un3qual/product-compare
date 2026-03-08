defmodule ProductCompareWeb.AuthJSON do
  @moduledoc false

  def viewer(%{viewer: viewer}) do
    %{
      viewer: %{
        id: viewer.id,
        email: viewer.email
      }
    }
  end

  def error(%{code: code, message: message}) do
    %{
      errors: [
        %{
          code: code,
          message: message
        }
      ]
    }
  end
end

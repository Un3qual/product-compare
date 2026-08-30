defmodule Mix.Tasks.ProductCompare.Ingestion.CjCredentialsTest do
  use ExUnit.Case, async: false

  import ExUnit.CaptureIO

  alias Mix.Tasks.ProductCompare.Ingestion.CjCredentials

  @cj_env_vars ~w(CJ_API_TOKEN CJ_ACCOUNT_ID CJ_PROPERTY_ID)

  setup do
    original_env =
      @cj_env_vars
      |> Map.new(fn var -> {var, System.get_env(var)} end)

    Enum.each(@cj_env_vars, &System.delete_env/1)

    on_exit(fn ->
      Enum.each(original_env, fn
        {var, nil} -> System.delete_env(var)
        {var, value} -> System.put_env(var, value)
      end)
    end)
  end

  describe "run/1" do
    test "accepts only one valid require-ready switch" do
      System.put_env("CJ_API_TOKEN", "secret-token")
      System.put_env("CJ_ACCOUNT_ID", "1234567")

      invalid_cases = [
        {["--bogus"], "unsupported option: --bogus"},
        {["extra"], "unexpected argument: extra"},
        {["--require-ready", "--require-ready"], "duplicate option: --require-ready"},
        {["--require-ready=maybe"], "invalid value for --require-ready: maybe"}
      ]

      Enum.each(invalid_cases, fn {argv, expected_message} ->
        assert_raise Mix.Error, expected_message, fn ->
          capture_io(fn -> CjCredentials.run(argv) end)
        end
      end)
    end

    test "reports missing required credentials when no CJ env vars are set" do
      output = capture_io(fn -> CjCredentials.run([]) end)

      assert output =~ "provider=cj\n"
      assert output =~ "ready=false\n"
      assert output =~ "required_present=0\n"
      assert output =~ "missing_required=CJ_API_TOKEN,CJ_ACCOUNT_ID\n"
    end

    test "treats blank env vars as missing" do
      System.put_env("CJ_API_TOKEN", "  ")
      System.put_env("CJ_ACCOUNT_ID", "\t")
      System.put_env("CJ_PROPERTY_ID", "\n")

      output = capture_io(fn -> CjCredentials.run([]) end)

      assert output =~ "ready=false\n"
      assert output =~ "required_present=0\n"
      assert output =~ "missing_required=CJ_API_TOKEN,CJ_ACCOUNT_ID\n"
      assert output =~ "optional_present=\n"
    end

    test "reports ready when required credentials are present" do
      System.put_env("CJ_API_TOKEN", "secret-token")
      System.put_env("CJ_ACCOUNT_ID", "1234567")

      output = capture_io(fn -> CjCredentials.run([]) end)

      assert output =~ "ready=true\n"
      assert output =~ "required_present=2\n"
      assert output =~ "missing_required=\n"
    end

    test "reports optional property id by variable name without printing its value" do
      System.put_env("CJ_API_TOKEN", "secret-token")
      System.put_env("CJ_ACCOUNT_ID", "1234567")
      System.put_env("CJ_PROPERTY_ID", "property-999")

      output = capture_io(fn -> CjCredentials.run([]) end)

      assert output =~ "optional_present=CJ_PROPERTY_ID\n"
      refute output =~ "property-999"
    end

    test "never prints sample CJ env values" do
      System.put_env("CJ_API_TOKEN", "secret-token")
      System.put_env("CJ_ACCOUNT_ID", "1234567")
      System.put_env("CJ_PROPERTY_ID", "property-999")

      output = capture_io(fn -> CjCredentials.run([]) end)

      refute output =~ "secret-token"
      refute output =~ "1234567"
      refute output =~ "property-999"
    end

    test "raises with only missing env var names when readiness is required" do
      assert_raise Mix.Error, "missing CJ credentials: CJ_API_TOKEN,CJ_ACCOUNT_ID", fn ->
        capture_io(fn -> CjCredentials.run(["--require-ready"]) end)
      end
    end

    test "exits normally when readiness is required and required credentials are present" do
      System.put_env("CJ_API_TOKEN", "secret-token")
      System.put_env("CJ_ACCOUNT_ID", "1234567")

      output = capture_io(fn -> CjCredentials.run(["--require-ready"]) end)

      assert output =~ "ready=true\n"
      assert output =~ "missing_required=\n"
    end
  end
end

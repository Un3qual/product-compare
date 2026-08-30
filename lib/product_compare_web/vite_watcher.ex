defmodule ProductCompareWeb.ViteWatcher do
  @moduledoc false

  @shutdown_timeout 5_000
  @vite_args ["node_modules/vite/bin/vite.js", "--host", "127.0.0.1"]

  def run(assets_path) do
    Process.flag(:trap_exit, true)

    port =
      Port.open(
        {:spawn_executable, executable!("node")},
        [
          :binary,
          :exit_status,
          :stderr_to_stdout,
          :use_stdio,
          args: @vite_args,
          cd: assets_path
        ]
      )

    {:os_pid, os_pid} = Port.info(port, :os_pid)
    await_vite(port, os_pid)
  end

  defp await_vite(port, os_pid) do
    receive do
      {^port, {:data, output}} ->
        IO.binwrite(output)
        await_vite(port, os_pid)

      {^port, {:exit_status, 0}} ->
        :ok

      {^port, {:exit_status, status}} ->
        exit({:vite_exit_status, status})

      {:EXIT, ^port, :normal} ->
        :ok

      {:EXIT, ^port, reason} ->
        exit(reason)

      {:EXIT, _linked_process, _reason} ->
        stop_vite(port, os_pid)
    end
  end

  defp stop_vite(port, os_pid) do
    signal(os_pid, "TERM")
    await_vite_shutdown(port, os_pid)
  end

  defp await_vite_shutdown(port, os_pid) do
    receive do
      {^port, {:data, output}} ->
        IO.binwrite(output)
        await_vite_shutdown(port, os_pid)

      {^port, {:exit_status, _status}} ->
        :ok

      {:EXIT, ^port, _reason} ->
        :ok
    after
      @shutdown_timeout ->
        signal(os_pid, "KILL")
    end
  end

  defp signal(os_pid, signal) do
    System.cmd(
      executable!("kill"),
      ["-#{signal}", Integer.to_string(os_pid)],
      stderr_to_stdout: true
    )

    :ok
  end

  defp executable!(name) do
    System.find_executable(name) || raise "required executable not found: #{name}"
  end
end

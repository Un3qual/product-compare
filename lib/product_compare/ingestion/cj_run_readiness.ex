defmodule ProductCompare.Ingestion.CJRunReadiness do
  @moduledoc false

  import Ecto.Query

  alias ProductCompare.Repo
  alias ProductCompareSchemas.Ingestion.ImportRun

  @provider "cj"

  @spec latest_success(String.t()) :: ImportRun.t() | nil
  def latest_success(surface) do
    ImportRun
    |> where([run], run.provider == @provider)
    |> where([run], run.surface == ^surface)
    |> where([run], run.status == :succeeded)
    |> order_by([run], desc_nulls_last: run.finished_at, desc: run.started_at, desc: run.id)
    |> limit(1)
    |> Repo.one()
  end

  @spec fresh?(ImportRun.t() | nil, pos_integer()) :: boolean()
  def fresh?(%ImportRun{finished_at: %DateTime{} = finished_at}, max_age_hours) do
    DateTime.diff(DateTime.utc_now(), finished_at, :second) <= max_age_hours * 60 * 60
  end

  def fresh?(_latest_success, _max_age_hours), do: false
end

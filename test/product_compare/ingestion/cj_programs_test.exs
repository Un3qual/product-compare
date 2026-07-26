defmodule ProductCompare.Ingestion.CJProgramsTest do
  use ProductCompare.DataCase, async: false

  import Ecto.Query, only: [from: 2, limit: 2]

  import ProductCompare.Fixtures.CJIngestionFixtures
  import ProductCompare.DatabaseTestHelpers, only: [assert_blocked_by: 2]

  alias ProductCompare.Ingestion
  alias ProductCompare.Ingestion.CJPrograms
  alias ProductCompare.Repo
  alias ProductCompareSchemas.Ingestion.CJProgram

  test "two CJ feeds with one trimmed advertiser ID share one program" do
    source = source_fixture()

    assert {:ok, first_feed} =
             Ingestion.upsert_merchant_feed_candidate(source, %{
               advertiser_id: "  adv-shared  ",
               provider: "cj",
               provider_feed_id: "feed-first"
             })

    assert {:ok, second_feed} =
             Ingestion.upsert_merchant_feed_candidate(source, %{
               advertiser_id: "adv-shared",
               provider: "cj",
               provider_feed_id: "feed-second"
             })

    assert first_feed.cj_program_id == second_feed.cj_program_id

    assert %CJProgram{advertiser_id: "adv-shared", stage: "new"} =
             Repo.get!(CJProgram, first_feed.cj_program_id)

    assert Repo.aggregate(CJProgram, :count, :id) == 1
  end

  test "the same advertiser ID in two sources creates two programs" do
    first_source = source_fixture()
    second_source = source_fixture(%{name: "Second CJ", domain: "second-cj.example"})

    assert {:ok, first_feed} =
             Ingestion.upsert_merchant_feed_candidate(first_source, %{
               advertiser_id: "adv-shared",
               provider: "cj",
               provider_feed_id: "feed-first"
             })

    assert {:ok, second_feed} =
             Ingestion.upsert_merchant_feed_candidate(second_source, %{
               advertiser_id: "adv-shared",
               provider: "cj",
               provider_feed_id: "feed-second"
             })

    refute first_feed.cj_program_id == second_feed.cj_program_id
    assert Repo.aggregate(CJProgram, :count, :id) == 2
  end

  test "blank advertiser IDs and non-CJ feeds remain unmatched" do
    source = source_fixture()

    assert {:ok, blank_cj_feed} =
             Ingestion.upsert_merchant_feed_candidate(source, %{
               advertiser_id: "   ",
               provider: "cj",
               provider_feed_id: "feed-blank"
             })

    assert {:ok, other_provider_feed} =
             Ingestion.upsert_merchant_feed_candidate(source, %{
               advertiser_id: "adv-other-provider",
               provider: "impact",
               provider_feed_id: "feed-impact"
             })

    assert is_nil(blank_cj_feed.cj_program_id)
    assert is_nil(other_provider_feed.cj_program_id)
    assert Repo.aggregate(CJProgram, :count, :id) == 0
  end

  test "refreshing and adding feeds preserve the program stage and note" do
    source = source_fixture()

    assert {:ok, first_feed} =
             Ingestion.upsert_merchant_feed_candidate(source, %{
               advertiser_id: "adv-preserved",
               provider: "cj",
               provider_feed_id: "feed-first"
             })

    program = Repo.get!(CJProgram, first_feed.cj_program_id)
    changed_at = ~U[2026-07-25 14:00:00.000000Z]

    assert {:ok, %{stage: "applied", note: "Follow up Tuesday"} = updated_program} =
             CJPrograms.update_lifecycle(
               program.entropy_id,
               %{stage: "applied", note: "Follow up Tuesday"},
               changed_at
             )

    assert {:ok, refreshed_feed} =
             Ingestion.upsert_merchant_feed_candidate(source, %{
               advertiser_id: "adv-preserved",
               feed_name: "Refreshed feed",
               provider: "cj",
               provider_feed_id: "feed-first"
             })

    assert {:ok, second_feed} =
             Ingestion.upsert_merchant_feed_candidate(source, %{
               advertiser_id: "adv-preserved",
               provider: "cj",
               provider_feed_id: "feed-second"
             })

    assert refreshed_feed.cj_program_id == updated_program.id
    assert second_feed.cj_program_id == updated_program.id

    assert %CJProgram{stage: "applied", note: "Follow up Tuesday", changed_at: ^changed_at} =
             Repo.get!(CJProgram, updated_program.id)
  end

  test "lifecycle updates do not impose an artificial stage sequence" do
    source = source_fixture()
    program = source |> cj_program_fixture() |> persist_stage("accepted")

    assert {:ok, %CJProgram{stage: "considering"}} =
             CJPrograms.update_lifecycle(
               program.entropy_id,
               %{stage: "considering", note: "Reconsidering"},
               ~U[2026-07-25 15:00:00.000000Z]
             )
  end

  test "blank notes become nil and unchanged saves preserve changed_at" do
    source = source_fixture()
    program = cj_program_fixture(source)
    blanked_at = ~U[2026-07-25 16:00:00.000000Z]
    unchanged_at = ~U[2026-07-25 17:00:00.000000Z]

    assert {:ok, %CJProgram{stage: "considering", note: nil, changed_at: ^blanked_at}} =
             CJPrograms.update_lifecycle(
               program.entropy_id,
               %{"stage" => "considering", "note" => "   "},
               blanked_at
             )

    assert {:ok, %CJProgram{stage: "considering", note: nil, changed_at: ^blanked_at}} =
             CJPrograms.update_lifecycle(
               program.entropy_id,
               %{stage: "considering", note: nil},
               unchanged_at
             )
  end

  test "invalid lifecycle values are rejected even when casting produces no changes" do
    source = source_fixture()
    program = cj_program_fixture(source)

    assert {:error, changeset} =
             CJPrograms.update_lifecycle(
               program.entropy_id,
               %{stage: %{"invalid" => "value"}},
               ~U[2026-07-25 17:30:00.000000Z]
             )

    assert {"is invalid", _metadata} = changeset.errors[:stage]
  end

  test "expected change time prevents stale lifecycle updates" do
    source = source_fixture()
    program = cj_program_fixture(source)
    original_changed_at = program.changed_at
    first_change_at = ~U[2026-07-25 17:45:00.000000Z]

    assert {:ok, %CJProgram{stage: "applied", changed_at: ^first_change_at}} =
             CJPrograms.update_lifecycle(
               program.entropy_id,
               %{stage: "applied", expected_changed_at: original_changed_at},
               first_change_at
             )

    assert {:error, :stale} =
             CJPrograms.update_lifecycle(
               program.entropy_id,
               %{stage: "declined", expected_changed_at: original_changed_at},
               ~U[2026-07-25 17:50:00.000000Z]
             )

    assert %CJProgram{stage: "applied", changed_at: ^first_change_at} =
             Repo.get!(CJProgram, program.id)
  end

  test "an unchanged save conflicts when the row changes after its initial read" do
    parent = self()
    concurrent_change_at = ~U[2026-07-25 17:55:00.000000Z]

    {source_id, program} =
      Ecto.Adapters.SQL.Sandbox.unboxed_run(Repo, fn ->
        source =
          source_fixture(%{
            name: "Concurrent lifecycle source",
            domain: "concurrent-lifecycle-#{System.unique_integer([:positive])}.example"
          })

        {source.id, cj_program_fixture(source)}
      end)

    on_exit(fn ->
      Ecto.Adapters.SQL.Sandbox.unboxed_run(Repo, fn ->
        Repo.query!("DELETE FROM sources WHERE id = $1", [source_id])
      end)
    end)

    lock_holder =
      Task.async(fn ->
        Ecto.Adapters.SQL.Sandbox.unboxed_run(Repo, fn ->
          Repo.transaction(fn ->
            backend_pid = Repo.query!("SELECT pg_backend_pid()").rows |> hd() |> hd()

            Repo.one!(
              from locked_program in CJProgram,
                where: locked_program.id == ^program.id,
                lock: "FOR UPDATE"
            )
            |> Ecto.Changeset.change(stage: "applied", changed_at: concurrent_change_at)
            |> Repo.update!()

            send(parent, {:lifecycle_change_held, backend_pid})

            receive do
              :commit_lifecycle_change -> :ok
            after
              5_000 -> flunk("timed out waiting to commit the concurrent lifecycle change")
            end
          end)
        end)
      end)

    assert_receive {:lifecycle_change_held, lock_backend_pid}

    unchanged_save =
      Task.async(fn ->
        Ecto.Adapters.SQL.Sandbox.unboxed_run(Repo, fn ->
          Repo.transaction(fn ->
            backend_pid = Repo.query!("SELECT pg_backend_pid()").rows |> hd() |> hd()
            send(parent, {:unchanged_save_started, backend_pid})

            CJPrograms.update_lifecycle(
              program.entropy_id,
              %{
                stage: program.stage,
                note: program.note,
                expected_changed_at: program.changed_at
              },
              ~U[2026-07-25 18:00:00.000000Z]
            )
          end)
        end)
      end)

    assert_receive {:unchanged_save_started, unchanged_save_backend_pid}

    try do
      assert_blocked_by(unchanged_save_backend_pid, lock_backend_pid)
    after
      send(lock_holder.pid, :commit_lifecycle_change)
    end

    assert {:ok, :ok} = Task.await(lock_holder)
    assert {:ok, {:error, :stale}} = Task.await(unchanged_save)

    assert %CJProgram{stage: "applied", changed_at: ^concurrent_change_at} =
             Ecto.Adapters.SQL.Sandbox.unboxed_run(Repo, fn ->
               Repo.get!(CJProgram, program.id)
             end)
  end

  test "invalid stages and missing entropy IDs make no change" do
    source = source_fixture()
    program = cj_program_fixture(source)

    assert {:error, changeset} =
             CJPrograms.update_lifecycle(
               program.entropy_id,
               %{stage: "paused", note: "Wrong stage"},
               ~U[2026-07-25 18:00:00.000000Z]
             )

    assert {"is invalid", _metadata} = changeset.errors[:stage]

    assert {:error, :not_found} =
             CJPrograms.update_lifecycle(
               Ecto.UUID.generate(),
               %{stage: "applied", note: "Missing record"},
               ~U[2026-07-25 18:00:00.000000Z]
             )

    assert %CJProgram{stage: "new", note: nil} = Repo.get!(CJProgram, program.id)
    assert Repo.aggregate(CJProgram, :count, :id) == 1
  end

  test "a failed feed upsert rolls back newly created program state" do
    source = source_fixture()

    assert {:error, _changeset} =
             Ingestion.upsert_merchant_feed_candidate(source, %{
               advertiser_id: "adv-rolled-back",
               provider: "cj"
             })

    assert is_nil(Repo.get_by(CJProgram, source_id: source.id, advertiser_id: "adv-rolled-back"))
  end

  test "stage counts include every lifecycle stage and cover programs beyond the current page" do
    source = source_fixture()
    {new_program, _new_feed} = program_with_feed(source, %{advertiser_name: "Alpha"})
    {selected_program, _selected_feed} = program_with_feed(source, %{advertiser_name: "Bravo"})

    persist_stage(selected_program, "selected")

    assert [_one_program] =
             CJPrograms.list_query(sort: :name_asc)
             |> limit(1)
             |> Repo.all()

    assert CJPrograms.stage_counts() == %{
             new: 1,
             considering: 0,
             selected: 1,
             applied: 0,
             accepted: 0,
             not_pursuing: 0,
             declined: 0
           }

    assert new_program.id != selected_program.id
  end

  test "program stage filtering accepts only stored lifecycle stages" do
    source = source_fixture()
    {_new_program, _new_feed} = program_with_feed(source, %{advertiser_name: "Alpha"})
    {selected_program, _selected_feed} = program_with_feed(source, %{advertiser_name: "Bravo"})

    persist_stage(selected_program, "selected")

    assert [selected_id] =
             CJPrograms.list_query(stage: "selected")
             |> Repo.all()
             |> Enum.map(& &1.id)

    assert selected_id == selected_program.id

    assert [] =
             CJPrograms.list_query(stage: "paused")
             |> Repo.all()
             |> Enum.map(& &1.id)

    assert [] =
             CJPrograms.list_feeds_query(stage: "paused")
             |> Repo.all()
             |> Enum.map(& &1.id)
  end

  test "program name uses the newest nonblank feed name with a feed ID tie break and advertiser fallback" do
    source = source_fixture()

    {named_program, _first_feed} =
      program_with_feed(source, %{
        advertiser_id: "name-winner",
        advertiser_name: "Alpha name",
        last_seen_at: ~U[2026-07-25 10:00:00.000000Z]
      })

    _second_feed =
      merchant_feed_candidate_fixture(source, %{
        advertiser_id: "name-winner",
        advertiser_name: "Bravo name",
        last_seen_at: ~U[2026-07-25 10:00:00.000000Z]
      })

    _newest_blank_feed =
      merchant_feed_candidate_fixture(source, %{
        advertiser_id: "name-winner",
        advertiser_name: "   ",
        last_seen_at: ~U[2026-07-25 11:00:00.000000Z]
      })

    {fallback_program, _fallback_feed} =
      program_with_feed(source, %{
        advertiser_id: "advertiser-id-fallback",
        advertiser_name: " ",
        last_seen_at: ~U[2026-07-25 12:00:00.000000Z]
      })

    programs_by_id =
      CJPrograms.list_query()
      |> Repo.all()
      |> Map.new(&{&1.id, &1})

    assert programs_by_id[named_program.id].advertiser_name == "Bravo name"
    assert programs_by_id[fallback_program.id].advertiser_name == "advertiser-id-fallback"
  end

  test "name sorting uses the program ID as its final ascending tie break" do
    source = source_fixture()
    {first_program, _first_feed} = program_with_feed(source, %{advertiser_name: "Same name"})
    {second_program, _second_feed} = program_with_feed(source, %{advertiser_name: "Same name"})

    assert Enum.sort([first_program.id, second_program.id]) ==
             CJPrograms.list_query(sort: :name_asc)
             |> Repo.all()
             |> Enum.map(& &1.id)
  end

  test "last changed sorting uses the program ID as its final ascending tie break" do
    source = source_fixture()
    {first_program, _first_feed} = program_with_feed(source, %{advertiser_name: "Alpha"})
    {second_program, _second_feed} = program_with_feed(source, %{advertiser_name: "Bravo"})
    {newest_program, _newest_feed} = program_with_feed(source, %{advertiser_name: "Charlie"})

    tie_time = ~U[2026-07-25 12:00:00.000000Z]
    persist_stage(first_program, "considering", tie_time)
    persist_stage(second_program, "considering", tie_time)
    persist_stage(newest_program, "considering", ~U[2026-07-25 13:00:00.000000Z])

    assert [newest_id | tied_ids] =
             CJPrograms.list_query(sort: :last_changed_desc)
             |> Repo.all()
             |> Enum.map(& &1.id)

    assert newest_id == newest_program.id
    assert tied_ids == Enum.sort([first_program.id, second_program.id])
  end

  test "feed count sorting uses the program ID as its final ascending tie break" do
    source = source_fixture()
    {first_program, _first_feed} = program_with_feed(source, %{advertiser_id: "first"})
    {second_program, _second_feed} = program_with_feed(source, %{advertiser_id: "second"})
    {largest_program, _largest_feed} = program_with_feed(source, %{advertiser_id: "largest"})

    Enum.each(["first", "second"], fn advertiser_id ->
      merchant_feed_candidate_fixture(source, %{advertiser_id: advertiser_id})
    end)

    Enum.each(1..2, fn feed_number ->
      merchant_feed_candidate_fixture(source, %{
        advertiser_id: "largest",
        provider_feed_id: "largest-extra-#{feed_number}"
      })
    end)

    assert [largest_id | tied_ids] =
             CJPrograms.list_query(sort: :feed_count_desc)
             |> Repo.all()
             |> Enum.map(& &1.id)

    assert largest_id == largest_program.id
    assert tied_ids == Enum.sort([first_program.id, second_program.id])

    feed_counts =
      CJPrograms.list_query()
      |> Repo.all()
      |> Map.new(&{&1.id, &1.feed_count})

    assert feed_counts[first_program.id] == 2
    assert feed_counts[second_program.id] == 2
    assert feed_counts[largest_program.id] == 3
  end

  test "feed queries filter linked CJ feeds by program and stage without aggregating product counts" do
    source = source_fixture()

    {selected_program, first_feed} =
      program_with_feed(source, %{
        advertiser_id: "selected",
        last_seen_at: ~U[2026-07-25 09:00:00.000000Z],
        product_count: 7
      })

    second_feed =
      merchant_feed_candidate_fixture(source, %{
        advertiser_id: "selected",
        last_seen_at: ~U[2026-07-25 10:00:00.000000Z],
        product_count: 11
      })

    {other_program, _other_feed} =
      program_with_feed(source, %{
        advertiser_id: "other",
        last_seen_at: ~U[2026-07-25 11:00:00.000000Z],
        product_count: 99
      })

    persist_stage(selected_program, "selected")

    assert [{second_feed.id, 11}, {first_feed.id, 7}] ==
             CJPrograms.list_feeds_query(program_id: selected_program.id)
             |> Repo.all()
             |> Enum.map(&{&1.id, &1.product_count})

    assert [{second_feed.id, 11}, {first_feed.id, 7}] ==
             CJPrograms.list_feeds_query(stage: "selected")
             |> Repo.all()
             |> Enum.map(&{&1.id, &1.product_count})

    assert other_program.id != selected_program.id
  end

  test "feed ordering breaks equal last-seen times by feed ID ascending" do
    source = source_fixture()

    {program, first_feed} =
      program_with_feed(source, %{
        advertiser_id: "feed-order",
        last_seen_at: ~U[2026-07-25 12:00:00.000000Z]
      })

    second_feed =
      merchant_feed_candidate_fixture(source, %{
        advertiser_id: "feed-order",
        last_seen_at: ~U[2026-07-25 12:00:00.000000Z]
      })

    assert Enum.sort([first_feed.id, second_feed.id]) ==
             CJPrograms.list_feeds_query(program_id: program.id)
             |> Repo.all()
             |> Enum.map(& &1.id)
  end

  test "unmatched feed queries exclude linked and non-CJ feeds and do not return raw metadata" do
    source = source_fixture()
    {_linked_program, _linked_feed} = program_with_feed(source, %{advertiser_id: "linked"})

    unmatched_feed =
      merchant_feed_candidate_fixture(source, %{
        advertiser_id: "   ",
        provider_feed_id: "unmatched",
        raw_metadata: %{"tracking_token" => "not-for-read-models"}
      })

    _non_cj_feed =
      merchant_feed_candidate_fixture(source, %{
        advertiser_id: "impact",
        provider: "impact",
        provider_feed_id: "non-cj"
      })

    assert [%{id: unmatched_id, raw_metadata: raw_metadata}] =
             CJPrograms.list_unmatched_feeds_query()
             |> Repo.all()

    assert unmatched_id == unmatched_feed.id
    assert raw_metadata in [nil, %{}]
  end

  test "pursued stages are the selected application lifecycle" do
    assert CJPrograms.pursued_stages() == ["selected", "applied", "accepted"]
  end

  defp persist_stage(program, stage) do
    persist_stage(program, stage, ~U[2026-07-25 13:00:00.000000Z])
  end

  defp persist_stage(program, stage, changed_at) do
    program
    |> CJProgram.lifecycle_changeset(%{
      stage: stage,
      note: "Existing decision for #{stage}"
    })
    |> Ecto.Changeset.put_change(:changed_at, changed_at)
    |> Repo.update!()
  end

  defp program_with_feed(source, attrs) do
    feed = merchant_feed_candidate_fixture(source, attrs)
    {Repo.get!(CJProgram, feed.cj_program_id), feed}
  end
end

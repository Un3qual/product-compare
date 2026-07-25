defmodule ProductCompare.Ingestion.CJProgramsTest do
  use ProductCompare.DataCase, async: true

  import ProductCompare.Fixtures.CJIngestionFixtures

  alias ProductCompare.Ingestion
  alias ProductCompare.Ingestion.CJPrograms
  alias ProductCompare.Repo
  alias ProductCompareSchemas.Ingestion.CJProgram

  @stages ~w(new considering selected applied accepted not_pursuing declined)

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

  test "every allowed stage can be selected directly" do
    source = source_fixture()
    program = cj_program_fixture(source)

    for stage <- @stages do
      assert {:ok, %CJProgram{stage: ^stage}} =
               CJPrograms.update_lifecycle(
                 program.entropy_id,
                 %{stage: stage, note: "Decision for #{stage}"},
                 ~U[2026-07-25 15:00:00.000000Z]
               )
    end
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
end

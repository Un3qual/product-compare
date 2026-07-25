defmodule ProductCompare.Ingestion.CJProgramSchemaTest do
  use ProductCompare.DataCase, async: true

  alias ProductCompareSchemas.Ingestion.CJProgram

  @stages ~w(new considering selected applied accepted not_pursuing declined)
  @changed_at ~U[2026-07-25 12:00:00.000000Z]

  test "identity changeset requires source, caller-trimmed advertiser identity, stage, and change time" do
    changeset = CJProgram.changeset(%CJProgram{}, %{})

    refute changeset.valid?

    assert %{
             source_id: ["can't be blank"],
             advertiser_id: ["can't be blank"],
             stage: ["can't be blank"],
             changed_at: ["can't be blank"]
           } = errors_on(changeset)

    valid_changeset =
      CJProgram.changeset(%CJProgram{}, %{
        source_id: 1,
        advertiser_id: "adv-trimmed-by-caller",
        stage: "new",
        changed_at: @changed_at
      })

    assert valid_changeset.valid?
    assert Ecto.Changeset.get_change(valid_changeset, :advertiser_id) == "adv-trimmed-by-caller"
  end

  test "identity changeset rejects a stage outside the program lifecycle" do
    changeset =
      CJProgram.changeset(%CJProgram{}, %{
        source_id: 1,
        advertiser_id: "adv-stage",
        stage: "paused",
        changed_at: @changed_at
      })

    refute changeset.valid?
    assert %{stage: ["is invalid"]} = errors_on(changeset)
  end

  test "identity changeset rejects a blank advertiser identity" do
    changeset =
      CJProgram.changeset(%CJProgram{}, %{
        source_id: 1,
        advertiser_id: " ",
        stage: "new",
        changed_at: @changed_at
      })

    refute changeset.valid?
    assert %{advertiser_id: [_error]} = errors_on(changeset)
  end

  test "identity changeset requires the caller to trim advertiser identity" do
    changeset =
      CJProgram.changeset(%CJProgram{}, %{
        source_id: 1,
        advertiser_id: " adv-untrimmed ",
        stage: "new",
        changed_at: @changed_at
      })

    refute changeset.valid?
    assert %{advertiser_id: [_error]} = errors_on(changeset)
  end

  test "lifecycle changeset accepts every program stage" do
    for stage <- @stages do
      changeset =
        CJProgram.lifecycle_changeset(%CJProgram{}, %{
          stage: stage,
          note: "Decision for #{stage}",
          changed_at: @changed_at
        })

      assert changeset.valid?
      assert Ecto.Changeset.get_field(changeset, :stage) == stage
    end
  end

  test "lifecycle changeset rejects an unknown program stage" do
    changeset =
      CJProgram.lifecycle_changeset(%CJProgram{}, %{
        stage: "paused",
        changed_at: @changed_at
      })

    refute changeset.valid?
    assert %{stage: ["is invalid"]} = errors_on(changeset)
  end
end

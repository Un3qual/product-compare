defmodule ProductCompareWeb.Resolvers.SpecsResolver do
  @moduledoc false

  alias ProductCompareWeb.Resolvers.Specs.Corrections
  alias ProductCompareWeb.Resolvers.Specs.Reads
  alias ProductCompareSchemas.Specs.SpecificationCorrection

  @spec source_artifact(any(), %{id: String.t()}, Absinthe.Resolution.t()) ::
          {:ok, term() | nil}
          | {:error, String.t()}
          | Absinthe.Resolution.Helpers.dataloader_tuple()
  def source_artifact(parent, %{id: _id} = args, %{context: %{loader: _loader}} = resolution),
    do: Reads.source_artifact(parent, args, resolution)

  def source_artifact(parent, %{id: _id} = args, resolution),
    do: Reads.source_artifact(parent, args, resolution)

  @spec my_specification_corrections(any(), map(), Absinthe.Resolution.t()) ::
          {:ok, map()} | {:error, term()}
  def my_specification_corrections(
        parent,
        args,
        %{
          context: %{current_user: _user, loader: %Dataloader{}}
        } = resolution
      ),
      do: Reads.my_specification_corrections(parent, args, resolution)

  def my_specification_corrections(
        parent,
        args,
        %{context: %{current_user: _user}} = resolution
      ),
      do: Reads.my_specification_corrections(parent, args, resolution)

  def my_specification_corrections(parent, args, resolution),
    do: Reads.my_specification_corrections(parent, args, resolution)

  @spec specification_correction_moderation_queue(any(), map(), Absinthe.Resolution.t()) ::
          {:ok, map()} | {:error, term()}
  def specification_correction_moderation_queue(
        parent,
        args,
        %{context: %{loader: %Dataloader{}}} = resolution
      ),
      do: Reads.specification_correction_moderation_queue(parent, args, resolution)

  def specification_correction_moderation_queue(parent, args, resolution),
    do: Reads.specification_correction_moderation_queue(parent, args, resolution)

  @spec propose_specification_correction(any(), %{input: map()}, Absinthe.Resolution.t()) ::
          {:ok, map()}
  def propose_specification_correction(
        parent,
        %{input: _input} = args,
        %{context: %{current_user: _user}} = resolution
      ),
      do: Corrections.propose(parent, args, resolution)

  def propose_specification_correction(parent, args, resolution),
    do: Corrections.propose(parent, args, resolution)

  @spec moderate_specification_correction(any(), %{input: map()}, Absinthe.Resolution.t()) ::
          {:ok, map()}
  def moderate_specification_correction(parent, %{input: _input} = args, resolution),
    do: Corrections.moderate(parent, args, resolution)

  @spec correction_value_text(SpecificationCorrection.t(), map(), Absinthe.Resolution.t()) ::
          {:ok, String.t()}
  def correction_value_text(correction, args, resolution),
    do: Corrections.value_text(correction, args, resolution)

  @spec moderation_note(SpecificationCorrection.t(), map(), Absinthe.Resolution.t()) ::
          {:ok, String.t() | nil}
  def moderation_note(correction, args, resolution),
    do: Corrections.moderation_note(correction, args, resolution)
end

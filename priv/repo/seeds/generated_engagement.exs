defmodule ProductCompare.DevSeeds.GeneratedEngagement do
  @moduledoc false

  import Ecto.Query

  alias ProductCompare.Alerts
  alias ProductCompare.Catalog
  alias ProductCompare.DevSeeds.CommunityWrites
  alias ProductCompare.DevSeeds.CorrectionSafety
  alias ProductCompare.DevSeeds.Support
  alias ProductCompare.Discussions
  alias ProductCompare.Repo
  alias ProductCompare.Specs
  alias ProductCompareSchemas.Alerts.AlertEvent
  alias ProductCompareSchemas.Alerts.PriceWatchRule
  alias ProductCompareSchemas.Catalog.SavedComparisonItem
  alias ProductCompareSchemas.Catalog.SavedComparisonSet
  alias ProductCompareSchemas.Discussions.CommunityReport
  alias ProductCompareSchemas.Discussions.CommunityWriteReceipt
  alias ProductCompareSchemas.Discussions.ProductReview
  alias ProductCompareSchemas.Discussions.ProductThread
  alias ProductCompareSchemas.Discussions.ThreadPost
  alias ProductCompareSchemas.Specs.ProductAttributeClaim
  alias ProductCompareSchemas.Specs.ProductAttributeCurrent
  alias ProductCompareSchemas.Specs.SpecificationCorrection

  @targets %{
    bounded: %{
      saved_sets: 24,
      watches: 48,
      alerts: 64,
      reviews: 120,
      questions: 80,
      corrections: 24
    },
    full: %{
      saved_sets: 60,
      watches: 160,
      alerts: 240,
      reviews: 300,
      questions: 180,
      corrections: 90
    }
  }

  @watch_evaluation_fields [
    :last_evaluated_price_point_id,
    :last_condition_met,
    :last_evaluated_at,
    :last_event_at,
    :updated_at
  ]

  @spec seed!(map(), map(), map(), DateTime.t(), map(), map()) :: map()
  def seed!(accounts, catalog, marketplace, anchor, profile, named) do
    targets = Map.fetch!(@targets, profile.density)

    generated_saved_sets =
      seed_saved_sets!(
        accounts.shopper,
        catalog.all_products,
        targets.saved_sets - length(named.saved_sets),
        anchor
      )

    {generated_watches, watch_fixtures} =
      seed_watches!(
        accounts.shopper,
        catalog.all_products,
        marketplace,
        targets.watches - length(named.watches),
        anchor
      )

    generated_alerts =
      seed_alerts!(
        accounts.shopper,
        generated_watches,
        watch_fixtures,
        anchor,
        targets.alerts - length(named.alerts)
      )

    generated_reviews =
      seed_reviews!(
        accounts,
        catalog.all_products,
        anchor,
        targets.reviews - length(named.reviews)
      )

    generated_questions =
      seed_questions!(
        accounts,
        catalog.all_products,
        anchor,
        targets.questions - length(named.questions)
      )

    generated_corrections =
      seed_corrections!(
        accounts,
        catalog,
        targets.corrections - length(named.corrections)
      )

    %{
      saved_sets: generated_saved_sets,
      watches: generated_watches,
      alerts: generated_alerts,
      reviews: generated_reviews,
      questions: generated_questions,
      corrections: generated_corrections
    }
  end

  defp seed_saved_sets!(shopper, products, selected_count, anchor) do
    full_count = @targets.full.saved_sets - 2
    reconcile_saved_sets!(shopper, products, selected_count, full_count)

    fixtures =
      Enum.map(1..selected_count, fn index ->
        product_count = 2 + rem(index, 2)

        product_ids =
          products
          |> Stream.cycle()
          |> Stream.drop(index * 3)
          |> Enum.take(product_count)
          |> Enum.map(& &1.id)

        %{index: index, product_ids: product_ids}
      end)

    expected_entropy_ids = Enum.map(fixtures, &saved_set_entropy_id(&1.index))

    SavedComparisonSet
    |> where([saved_set], saved_set.entropy_id in ^expected_entropy_ids)
    |> Repo.all()
    |> Enum.each(fn saved_set ->
      if saved_set.user_id != shopper.id do
        raise "Generated saved comparison #{saved_set.entropy_id} belongs to another user"
      end
    end)

    rows =
      Enum.map(fixtures, fn fixture ->
        %SavedComparisonSet{}
        |> SavedComparisonSet.changeset(%{
          user_id: shopper.id,
          name:
            "Development comparison #{String.pad_leading(Integer.to_string(fixture.index), 2, "0")}"
        })
        |> Support.validated_row!(
          [:user_id, :name],
          entropy_id: saved_set_entropy_id(fixture.index),
          inserted_at: anchor,
          updated_at: anchor,
          stage: "generated saved comparison #{fixture.index}"
        )
      end)

    saved_sets =
      Support.sync_owned_rows!(SavedComparisonSet, rows, [:user_id, :name],
        stage: "generated saved comparisons"
      )

    existing_items =
      SavedComparisonItem
      |> where([item], item.saved_comparison_set_id in ^Enum.map(saved_sets, & &1.id))
      |> Repo.all()

    items_by_position =
      Map.new(existing_items, &{{&1.saved_comparison_set_id, &1.position}, &1})

    item_rows =
      Enum.zip_with(fixtures, saved_sets, fn fixture, saved_set ->
        fixture.product_ids
        |> Enum.with_index(1)
        |> Enum.map(fn {product_id, position} ->
          existing = Map.get(items_by_position, {saved_set.id, position})

          %SavedComparisonItem{}
          |> SavedComparisonItem.changeset(%{
            saved_comparison_set_id: saved_set.id,
            product_id: product_id,
            position: position
          })
          |> Support.validated_row!(
            [:saved_comparison_set_id, :product_id, :position],
            entropy_id:
              if(existing,
                do: existing.entropy_id,
                else:
                  Support.stable_uuid(
                    "development-saved-comparison-item",
                    "#{fixture.index}:#{position}"
                  )
              ),
            inserted_at: anchor,
            stage: "generated saved comparison #{fixture.index} item #{position}"
          )
        end)
      end)
      |> List.flatten()

    expected_item_ids = MapSet.new(item_rows, & &1.entropy_id)

    obsolete_item_ids =
      existing_items
      |> Enum.reject(&MapSet.member?(expected_item_ids, &1.entropy_id))
      |> Enum.map(& &1.id)

    if obsolete_item_ids != [] do
      SavedComparisonItem
      |> where([item], item.id in ^obsolete_item_ids)
      |> Repo.delete_all()
    end

    Support.sync_owned_rows!(
      SavedComparisonItem,
      item_rows,
      [:saved_comparison_set_id, :product_id, :position],
      stage: "generated saved comparison items"
    )

    Repo.preload(saved_sets, :items)
  end

  defp reconcile_saved_sets!(shopper, _products, selected_count, full_count) do
    if selected_count < full_count do
      Enum.each((selected_count + 1)..full_count, fn index ->
        case Repo.get_by(SavedComparisonSet, entropy_id: saved_set_entropy_id(index)) do
          nil ->
            :ok

          %SavedComparisonSet{user_id: user_id} = saved_set when user_id == shopper.id ->
            Catalog.delete_saved_comparison_set(shopper.id, saved_set.entropy_id)
            |> Support.expect!("delete full-only saved comparison #{index}")

          %SavedComparisonSet{} ->
            raise "Full-only saved comparison #{index} belongs to another user"
        end
      end)
    end
  end

  defp saved_set_entropy_id(index),
    do: Support.stable_uuid("development-saved-comparison", Integer.to_string(index))

  defp seed_watches!(shopper, products, marketplace, selected_count, anchor) do
    full_count = @targets.full.watches - 4
    reconcile_watches!(shopper, selected_count, full_count)

    points_by_offer = Enum.group_by(marketplace.all_price_points, & &1.merchant_product_id)
    offers_by_product = Enum.group_by(marketplace.all_offers, & &1.product_id)

    fixtures =
      Enum.map(1..selected_count, fn index ->
        product = Enum.at(products, rem(index + 4, length(products)))

        offer =
          offers_by_product
          |> Map.fetch!(product.id)
          |> Enum.filter(&Map.has_key?(points_by_offer, &1.id))
          |> Enum.filter(fn offer ->
            latest =
              points_by_offer
              |> Map.fetch!(offer.id)
              |> Enum.max_by(& &1.observed_at, DateTime)

            offer.is_active and latest.in_stock == true
          end)
          |> Enum.max_by(&(points_by_offer |> Map.fetch!(&1.id) |> length()))

        points =
          points_by_offer
          |> Map.fetch!(offer.id)
          |> Enum.uniq_by(& &1.id)
          |> Enum.sort_by(& &1.observed_at, {:desc, DateTime})

        %{index: index, product: product, offer: offer, points: points}
      end)

    rows =
      Enum.map(fixtures, fn fixture ->
        entropy_id = watch_entropy_id(fixture.index)
        type = Enum.at(PriceWatchRule.rule_types(), rem(fixture.index - 1, 4))
        point = hd(fixture.points)
        attrs = watch_attrs(type, fixture, point)

        %PriceWatchRule{}
        |> PriceWatchRule.create_changeset(
          attrs
          |> Map.put(:user_id, shopper.id)
          |> Map.put(:enabled, rem(fixture.index, 7) != 0)
        )
        |> Ecto.Changeset.change(
          entropy_id: entropy_id,
          last_evaluated_price_point_id: point.id,
          last_evaluated_at: point.observed_at,
          last_condition_met: false
        )
        |> Support.validated_row!(
          [
            :user_id,
            :product_id,
            :merchant_product_id,
            :rule_type,
            :currency,
            :target_amount,
            :percentage_drop,
            :baseline_price_point_id,
            :baseline_landed_price,
            :enabled,
            :last_evaluated_price_point_id,
            :last_condition_met,
            :last_evaluated_at,
            :last_event_at,
            :cooldown
          ],
          entropy_id: entropy_id,
          inserted_at: anchor,
          updated_at: anchor,
          stage: "generated watch #{fixture.index}"
        )
      end)

    entropy_ids = Enum.map(rows, & &1.entropy_id)

    existing_watches =
      PriceWatchRule
      |> where([watch], watch.entropy_id in ^entropy_ids)
      |> Repo.all()

    Enum.each(existing_watches, fn watch ->
      if watch.user_id != shopper.id do
        raise "Generated watch #{watch.entropy_id} belongs to another user"
      end
    end)

    existing_by_entropy_id = Map.new(existing_watches, &{&1.entropy_id, &1})
    existing_watch_ids = Enum.map(existing_watches, & &1.id)
    seed_alert_entropy_ids = seed_alert_entropy_ids()

    locally_evaluated_watch_ids =
      AlertEvent
      |> where(
        [event],
        event.watch_rule_id in ^existing_watch_ids and
          event.entropy_id not in ^seed_alert_entropy_ids
      )
      |> select([event], event.watch_rule_id)
      |> distinct(true)
      |> Repo.all()
      |> MapSet.new()

    rows =
      Enum.map(rows, fn row ->
        case Map.get(existing_by_entropy_id, row.entropy_id) do
          %PriceWatchRule{id: watch_id} = watch ->
            if MapSet.member?(locally_evaluated_watch_ids, watch_id) do
              Map.merge(row, Map.take(watch, @watch_evaluation_fields))
            else
              row
            end

          nil ->
            row
        end
      end)

    watches =
      Support.sync_owned_rows!(
        PriceWatchRule,
        rows,
        [
          :user_id,
          :product_id,
          :merchant_product_id,
          :rule_type,
          :currency,
          :target_amount,
          :percentage_drop,
          :baseline_price_point_id,
          :baseline_landed_price,
          :enabled,
          :last_evaluated_price_point_id,
          :last_condition_met,
          :last_evaluated_at,
          :last_event_at,
          :cooldown
        ],
        stage: "generated watches"
      )

    {watches, fixtures}
  end

  defp watch_attrs(:target_price, fixture, _point) do
    %{
      product_id: fixture.product.id,
      merchant_product_id: fixture.offer.id,
      rule_type: :target_price,
      currency: fixture.offer.currency,
      target_amount: "1500.00",
      cooldown_seconds: 86_400
    }
  end

  defp watch_attrs(:percentage_drop, fixture, point) do
    %{
      product_id: fixture.product.id,
      merchant_product_id: fixture.offer.id,
      rule_type: :percentage_drop,
      currency: fixture.offer.currency,
      percentage_drop: "10",
      baseline_price_point_id: point.id,
      baseline_landed_price: Decimal.add(point.price, point.shipping || Decimal.new("0")),
      cooldown_seconds: 86_400
    }
  end

  defp watch_attrs(type, fixture, _point) when type in [:back_in_stock, :newly_available] do
    %{
      product_id: fixture.product.id,
      merchant_product_id: fixture.offer.id,
      rule_type: type,
      currency: fixture.offer.currency,
      cooldown_seconds: 86_400
    }
  end

  defp reconcile_watches!(shopper, selected_count, full_count) do
    if selected_count < full_count do
      ensure_full_only_watches_have_only_seed_alerts!(selected_count, full_count)

      Enum.each((selected_count + 1)..full_count, fn index ->
        case Repo.get_by(PriceWatchRule, entropy_id: watch_entropy_id(index)) do
          nil ->
            :ok

          %PriceWatchRule{user_id: user_id} = watch when user_id == shopper.id ->
            AlertEvent |> where([event], event.watch_rule_id == ^watch.id) |> Repo.delete_all()

            Alerts.delete_watch(shopper.id, watch.entropy_id)
            |> Support.expect!("delete full-only watch #{index}")

          %PriceWatchRule{} ->
            raise "Full-only watch #{index} belongs to another user"
        end
      end)
    end
  end

  defp ensure_full_only_watches_have_only_seed_alerts!(selected_count, full_count) do
    indexes = Enum.to_list((selected_count + 1)..full_count)
    indexes_by_entropy_id = Map.new(indexes, &{watch_entropy_id(&1), &1})

    watches =
      PriceWatchRule
      |> where([watch], watch.entropy_id in ^Map.keys(indexes_by_entropy_id))
      |> select([watch], {watch.id, watch.entropy_id})
      |> Repo.all()

    indexes_by_watch_id =
      Map.new(watches, fn {watch_id, entropy_id} ->
        {watch_id, Map.fetch!(indexes_by_entropy_id, entropy_id)}
      end)

    seed_alert_entropy_ids = seed_alert_entropy_ids(indexes)

    unexpected_watch_id =
      AlertEvent
      |> where(
        [event],
        event.watch_rule_id in ^Map.keys(indexes_by_watch_id) and
          event.entropy_id not in ^seed_alert_entropy_ids
      )
      |> select([event], event.watch_rule_id)
      |> limit(1)
      |> Repo.one()

    if unexpected_watch_id do
      index = Map.fetch!(indexes_by_watch_id, unexpected_watch_id)
      raise "Refusing to delete full-only watch #{index} with locally evaluated alerts"
    end
  end

  defp watch_entropy_id(index),
    do: Support.stable_uuid("development-generated-watch", Integer.to_string(index))

  defp seed_alerts!(shopper, watches, fixtures, anchor, selected_count) do
    full_watch_count = @targets.full.watches - 4
    selected_event_keys = event_keys!(fixtures, selected_count)

    full_event_keys =
      for round <- 0..1, watch_index <- 1..full_watch_count, do: {watch_index, round}

    reconcile_alerts!(selected_event_keys, full_event_keys)

    watches_by_entropy_id = Map.new(watches, &{&1.entropy_id, &1})
    fixtures_by_index = Map.new(fixtures, &{&1.index, &1})

    rows =
      Enum.with_index(selected_event_keys, 1)
      |> Enum.map(fn {{watch_index, round}, event_index} ->
        watch = Map.fetch!(watches_by_entropy_id, watch_entropy_id(watch_index))
        fixture = Map.fetch!(fixtures_by_index, watch_index)
        point = Enum.at(fixture.points, rem(round, length(fixture.points)))
        shipping = point.shipping || Decimal.new("0")

        %{
          entropy_id: event_entropy_id(watch_index, round),
          watch_rule_id: watch.id,
          user_id: shopper.id,
          triggering_price_point_id: point.id,
          merchant_product_id: fixture.offer.id,
          rule_type: watch.rule_type,
          currency: fixture.offer.currency,
          item_price: point.price,
          shipping: shipping,
          landed_price: Decimal.add(point.price, shipping),
          observed_at: point.observed_at,
          baseline_landed_price: watch.baseline_landed_price,
          target_amount: watch.target_amount,
          percentage_drop: watch.percentage_drop,
          read_at: if(rem(event_index, 3) == 0, do: anchor, else: nil),
          inserted_at: DateTime.add(anchor, -event_index * 60, :second)
        }
      end)

    verify_alert_ownership!(rows)

    event_pairs = Enum.map(rows, &{&1.watch_rule_id, &1.triggering_price_point_id})

    if Enum.uniq(event_pairs) != event_pairs do
      duplicate_pairs =
        event_pairs
        |> Enum.frequencies()
        |> Enum.filter(fn {_pair, count} -> count > 1 end)

      raise "Generated alert plan contains duplicate watch/observation pairs: #{inspect(duplicate_pairs)}"
    end

    persisted_fields = [
      :watch_rule_id,
      :user_id,
      :triggering_price_point_id,
      :merchant_product_id,
      :rule_type,
      :currency,
      :item_price,
      :shipping,
      :landed_price,
      :observed_at,
      :baseline_landed_price,
      :target_amount,
      :percentage_drop,
      :read_at
    ]

    validated_rows =
      Enum.map(rows, fn row ->
        %AlertEvent{}
        |> AlertEvent.changeset(Map.take(row, persisted_fields))
        |> Support.validated_row!(persisted_fields,
          entropy_id: row.entropy_id,
          inserted_at: row.inserted_at,
          stage: "generated alert #{row.entropy_id}"
        )
      end)

    Support.sync_owned_rows!(AlertEvent, validated_rows, persisted_fields,
      stage: "generated alerts"
    )
  end

  @doc false
  @spec event_keys!([map()], non_neg_integer()) :: [{pos_integer(), non_neg_integer()}]
  def event_keys!(fixtures, event_count) do
    max_point_count = fixtures |> Enum.map(&length(&1.points)) |> Enum.max(fn -> 0 end)

    available_keys =
      for round <- 0..(max_point_count - 1)//1,
          fixture <- fixtures,
          length(fixture.points) > round do
        {fixture.index, round}
      end

    if length(available_keys) < event_count do
      raise "requested #{event_count} generated alerts but only #{length(available_keys)} price points exist"
    end

    Enum.take(available_keys, event_count)
  end

  defp event_entropy_id(watch_index, round) do
    Support.stable_uuid("development-generated-alert", "#{watch_index}:#{round}")
  end

  defp seed_alert_entropy_ids(indexes \\ 1..(@targets.full.watches - 4)) do
    for index <- indexes, round <- 0..1, do: event_entropy_id(index, round)
  end

  defp reconcile_alerts!(selected_keys, full_keys) do
    selected =
      MapSet.new(selected_keys, fn {watch_index, round} ->
        event_entropy_id(watch_index, round)
      end)

    obsolete =
      full_keys
      |> MapSet.new(fn {watch_index, round} -> event_entropy_id(watch_index, round) end)
      |> MapSet.difference(selected)
      |> MapSet.to_list()

    obsolete
    |> Enum.chunk_every(500)
    |> Enum.each(fn entropy_ids ->
      AlertEvent |> where([event], event.entropy_id in ^entropy_ids) |> Repo.delete_all()
    end)
  end

  defp verify_alert_ownership!(rows) do
    expected = Map.new(rows, &{&1.entropy_id, {&1.watch_rule_id, &1.user_id}})

    fetch_by_entropy_ids(AlertEvent, Map.keys(expected))
    |> Enum.each(fn event ->
      if Map.fetch!(expected, event.entropy_id) != {event.watch_rule_id, event.user_id} do
        raise "Refusing to adopt generated alert #{event.entropy_id}"
      end
    end)
  end

  defp seed_reviews!(accounts, products, anchor, selected_count) do
    full_count = @targets.full.reviews - 2
    reconcile_reviews!(accounts, products, selected_count, full_count)

    fixtures =
      Enum.map(1..selected_count, fn index ->
        review_fixture(accounts, products, index)
        |> Map.put(:index, index)
        |> Map.put(:status, Enum.at([:published, :pending, :hidden], rem(index - 1, 3)))
        |> Map.put(:attrs, %{
          rating: 1 + rem(index, 5),
          title: "Development review #{String.pad_leading(Integer.to_string(index), 3, "0")}",
          body:
            "Deterministic development review #{index} covering catalog and moderation states."
        })
      end)

    {existing_by_receipt, receipt_keys} =
      existing_content_by_receipt(fixtures, :review, ProductReview)

    existing_by_receipt =
      Map.merge(
        existing_by_receipt,
        insert_missing_reviews!(fixtures, receipt_keys, accounts.moderator, anchor)
      )

    Enum.map(fixtures, fn fixture ->
      case Map.get(existing_by_receipt, {fixture.owner.id, fixture.key}) do
        %ProductReview{} = review ->
          if review_baseline?(review, fixture) do
            review
          else
            seed_review_fixture!(fixture, accounts.moderator, anchor)
          end

        _missing_or_changed ->
          seed_review_fixture!(fixture, accounts.moderator, anchor)
      end
    end)
  end

  defp seed_review_fixture!(fixture, moderator, anchor) do
    review =
      CommunityWrites.submit_review(
        fixture.owner.id,
        fixture.product.id,
        fixture.attrs,
        fixture.key
      )
      |> Support.expect!("generated review #{fixture.index}")

    case active_replacement_review(review) do
      %ProductReview{} = replacement ->
        replacement

      nil ->
        reset_moderation? =
          fixture.status == :pending or review.moderation_status == :removed

        review =
          review
          |> ProductReview.changeset(%{
            rating: fixture.attrs.rating,
            title: fixture.attrs.title,
            body_md: fixture.attrs.body
          })
          |> Ecto.Changeset.change(
            moderation_status:
              if(reset_moderation?, do: :pending, else: review.moderation_status),
            moderation_note: if(reset_moderation?, do: nil, else: review.moderation_note),
            moderated_by: if(reset_moderation?, do: nil, else: review.moderated_by),
            moderated_at: if(reset_moderation?, do: nil, else: review.moderated_at)
          )
          |> Repo.update!()

        moderate_content!(:review, review, fixture.status, moderator, anchor)
    end
  end

  defp review_baseline?(review, fixture) do
    review.user_id == fixture.owner.id and review.product_id == fixture.product.id and
      review.rating == fixture.attrs.rating and review.title == fixture.attrs.title and
      review.body_md == fixture.attrs.body and review.moderation_status == fixture.status and
      moderation_baseline?(review, fixture.status)
  end

  defp active_replacement_review(%ProductReview{moderation_status: :removed} = review) do
    Repo.one(
      from replacement in ProductReview,
        where:
          replacement.user_id == ^review.user_id and
            replacement.product_id == ^review.product_id and
            replacement.moderation_status != :removed
    )
  end

  defp active_replacement_review(%ProductReview{}), do: nil

  defp review_fixture(accounts, products, index) do
    %{
      owner: if(rem(index, 2) == 1, do: accounts.shopper, else: accounts.participant),
      product: Enum.at(products, 5 + div(index - 1, 2)),
      key: "dev-seed-generated-review-#{String.pad_leading(Integer.to_string(index), 3, "0")}-v1"
    }
  end

  defp reconcile_reviews!(accounts, products, selected_count, full_count) do
    if selected_count < full_count do
      Enum.each((selected_count + 1)..full_count, fn index ->
        fixture = review_fixture(accounts, products, index)
        ensure_review_reconciliation_safe!(fixture)
        delete_receipt_content!(:review, fixture.owner, fixture.product, fixture.key)
      end)
    end
  end

  defp ensure_review_reconciliation_safe!(fixture) do
    with %CommunityWriteReceipt{} = receipt <-
           Repo.get_by(CommunityWriteReceipt,
             user_id: fixture.owner.id,
             content_type: :review,
             idempotency_key: fixture.key
           ),
         %ProductReview{} = review <-
           Repo.get_by(ProductReview, entropy_id: receipt.content_entropy_id),
         true <-
           Repo.exists?(from report in CommunityReport, where: report.review_id == ^review.id) do
      raise "Refusing to delete full-only review #{review.entropy_id} with reports"
    else
      _ -> :ok
    end
  end

  defp seed_questions!(accounts, products, anchor, selected_count) do
    full_count = @targets.full.questions - 2
    reconcile_questions!(accounts, products, selected_count, full_count)

    fixtures =
      Enum.map(1..selected_count, fn index ->
        question_fixture(accounts, products, index)
        |> Map.put(:index, index)
        |> Map.put(:status, question_status(index))
        |> Map.put(:attrs, %{
          title: "Development question #{String.pad_leading(Integer.to_string(index), 3, "0")}",
          body: "Which deterministic tradeoffs matter for development product #{index}?"
        })
      end)

    {questions_by_receipt, question_receipt_keys} =
      existing_content_by_receipt(fixtures, :question, ProductThread)

    questions_by_receipt =
      Map.merge(
        questions_by_receipt,
        insert_missing_questions!(fixtures, question_receipt_keys, accounts.moderator, anchor)
      )

    answer_fixtures =
      fixtures
      |> Enum.filter(&(&1.status == :published))
      |> Enum.map(fn fixture ->
        fixture
        |> Map.put(:question_owner, fixture.owner)
        |> Map.put(:question_key, fixture.key)
        |> Map.put(:owner, fixture.answer_owner)
        |> Map.put(:key, fixture.answer_key)
      end)

    {answers_by_receipt, answer_receipt_keys} =
      existing_content_by_receipt(answer_fixtures, :answer, ThreadPost)

    answers_by_receipt =
      Map.merge(
        answers_by_receipt,
        insert_missing_answers!(
          answer_fixtures,
          answer_receipt_keys,
          questions_by_receipt,
          accounts.moderator,
          anchor
        )
      )

    Enum.map(fixtures, fn fixture ->
      question = Map.get(questions_by_receipt, {fixture.owner.id, fixture.key})
      answer = Map.get(answers_by_receipt, {fixture.answer_owner.id, fixture.answer_key})

      if question_baseline?(question, answer, fixture) do
        question
      else
        seed_question_fixture!(accounts, fixture, anchor)
      end
    end)
  end

  defp seed_question_fixture!(accounts, fixture, anchor) do
    question =
      CommunityWrites.ask_question(
        fixture.owner.id,
        fixture.product.id,
        fixture.attrs,
        fixture.key
      )
      |> Support.expect!("generated question #{fixture.index}")

    reset_moderation? =
      fixture.status == :pending or question.moderation_status == :removed

    question =
      question
      |> ProductThread.changeset(%{
        title: fixture.attrs.title,
        body_md: fixture.attrs.body
      })
      |> Ecto.Changeset.change(
        moderation_status: if(reset_moderation?, do: :pending, else: question.moderation_status),
        moderation_note: if(reset_moderation?, do: nil, else: question.moderation_note),
        moderated_by: if(reset_moderation?, do: nil, else: question.moderated_by),
        moderated_at: if(reset_moderation?, do: nil, else: question.moderated_at)
      )
      |> Repo.update!()

    question =
      moderate_content!(
        :question,
        question,
        fixture.status,
        accounts.moderator,
        anchor
      )

    if fixture.status == :published do
      seed_generated_answer!(accounts, fixture, question, fixture.index, anchor)
    end

    question
  end

  defp question_baseline?(%ProductThread{} = question, answer, fixture) do
    question.created_by == fixture.owner.id and question.product_id == fixture.product.id and
      question.title == fixture.attrs.title and question.body_md == fixture.attrs.body and
      question.moderation_status == fixture.status and
      moderation_baseline?(question, fixture.status) and
      answer_baseline?(answer, question, fixture)
  end

  defp question_baseline?(_question, _answer, _fixture), do: false

  defp answer_baseline?(_answer, _question, %{status: status}) when status != :published,
    do: true

  defp answer_baseline?(%ThreadPost{} = answer, question, fixture) do
    expected_status = if(rem(fixture.index, 4) == 0, do: :hidden, else: :published)

    answer.thread_id == question.id and answer.user_id == fixture.answer_owner.id and
      answer.body_md ==
        "Deterministic development answer #{fixture.index} with practical comparison guidance." and
      answer.moderation_status == expected_status
  end

  defp answer_baseline?(_answer, _question, _fixture), do: false

  defp moderation_baseline?(record, :pending) do
    is_nil(record.moderation_note) and is_nil(record.moderated_by) and
      is_nil(record.moderated_at)
  end

  defp moderation_baseline?(_record, _status), do: true

  defp insert_missing_reviews!(fixtures, receipt_keys, moderator, anchor) do
    missing =
      Enum.reject(fixtures, &MapSet.member?(receipt_keys, {&1.owner.id, &1.key}))

    expected_pairs = MapSet.new(missing, &{&1.owner.id, &1.product.id})

    ProductReview
    |> where(
      [review],
      review.user_id in ^Enum.map(missing, & &1.owner.id) and
        review.product_id in ^Enum.map(missing, & &1.product.id)
    )
    |> Repo.all()
    |> Enum.each(fn review ->
      if MapSet.member?(expected_pairs, {review.user_id, review.product_id}) do
        raise "Generated review scope #{review.user_id}/#{review.product_id} already exists without its receipt"
      end
    end)

    fields = [
      :product_id,
      :user_id,
      :merchant_product_id,
      :rating,
      :title,
      :body_md,
      :verified_purchase,
      :moderation_status,
      :moderation_note,
      :moderated_by,
      :moderated_at
    ]

    entries =
      Enum.map(missing, fn fixture ->
        changeset =
          ProductReview.changeset_with_verified_purchase(
            %ProductReview{},
            %{
              user_id: fixture.owner.id,
              product_id: fixture.product.id,
              merchant_product_id: nil,
              rating: fixture.attrs.rating,
              title: fixture.attrs.title,
              body_md: fixture.attrs.body
            },
            false
          )

        digest =
          CommunityWrites.submission_digest!(
            changeset,
            :review,
            [:product_id, :merchant_product_id, :rating, :title, :body_md]
          )

        row =
          changeset
          |> Ecto.Changeset.change(moderation_seed_fields(fixture.status, moderator, anchor))
          |> Support.validated_row!(fields,
            entropy_id: Support.stable_uuid("development-generated-review", fixture.key),
            inserted_at: anchor,
            updated_at: anchor,
            stage: "generated review #{fixture.index}"
          )

        {fixture, row, digest}
      end)

    records =
      Support.sync_owned_rows!(ProductReview, Enum.map(entries, &elem(&1, 1)), fields,
        stage: "generated reviews"
      )

    insert_community_receipts!(entries, records, :review, anchor)
    content_map(entries, records)
  end

  defp insert_missing_questions!(fixtures, receipt_keys, moderator, anchor) do
    missing =
      Enum.reject(fixtures, &MapSet.member?(receipt_keys, {&1.owner.id, &1.key}))

    fields = [
      :product_id,
      :title,
      :body_md,
      :created_by,
      :moderation_status,
      :moderation_note,
      :moderated_by,
      :moderated_at
    ]

    entries =
      Enum.map(missing, fn fixture ->
        changeset =
          ProductThread.changeset(%ProductThread{}, %{
            product_id: fixture.product.id,
            created_by: fixture.owner.id,
            title: fixture.attrs.title,
            body_md: fixture.attrs.body
          })

        digest =
          CommunityWrites.submission_digest!(
            changeset,
            :question,
            [:product_id, :title, :body_md]
          )

        row =
          changeset
          |> Ecto.Changeset.change(moderation_seed_fields(fixture.status, moderator, anchor))
          |> Support.validated_row!(fields,
            entropy_id: Support.stable_uuid("development-generated-question", fixture.key),
            inserted_at: anchor,
            stage: "generated question #{fixture.index}"
          )

        {fixture, row, digest}
      end)

    records =
      Support.sync_owned_rows!(ProductThread, Enum.map(entries, &elem(&1, 1)), fields,
        stage: "generated questions"
      )

    insert_community_receipts!(entries, records, :question, anchor)
    content_map(entries, records)
  end

  defp insert_missing_answers!(
         fixtures,
         receipt_keys,
         questions_by_receipt,
         moderator,
         anchor
       ) do
    missing =
      Enum.reject(fixtures, &MapSet.member?(receipt_keys, {&1.owner.id, &1.key}))

    fields = [
      :thread_id,
      :parent_post_id,
      :user_id,
      :body_md,
      :moderation_status,
      :moderation_note,
      :moderated_by,
      :moderated_at
    ]

    entries =
      Enum.map(missing, fn fixture ->
        question =
          Map.fetch!(
            questions_by_receipt,
            {fixture.question_owner.id, fixture.question_key}
          )

        body =
          "Deterministic development answer #{fixture.index} with practical comparison guidance."

        status = if(rem(fixture.index, 4) == 0, do: :hidden, else: :published)

        changeset =
          ThreadPost.changeset(%ThreadPost{}, %{
            thread_id: question.id,
            user_id: fixture.owner.id,
            body_md: body
          })

        digest =
          CommunityWrites.submission_digest!(
            changeset,
            :answer,
            [:thread_id, :body_md],
            question.entropy_id
          )

        row =
          changeset
          |> Ecto.Changeset.change(moderation_seed_fields(status, moderator, anchor))
          |> Support.validated_row!(fields,
            entropy_id: Support.stable_uuid("development-generated-answer", fixture.key),
            inserted_at: anchor,
            updated_at: anchor,
            stage: "generated answer #{fixture.index}"
          )

        {fixture, row, digest}
      end)

    records =
      Support.sync_owned_rows!(ThreadPost, Enum.map(entries, &elem(&1, 1)), fields,
        stage: "generated answers"
      )

    insert_community_receipts!(entries, records, :answer, anchor)
    content_map(entries, records)
  end

  defp insert_community_receipts!([], [], _content_type, _anchor), do: :ok

  defp insert_community_receipts!(entries, records, content_type, anchor) do
    rows =
      Enum.zip_with(entries, records, fn {fixture, _row, digest}, record ->
        %CommunityWriteReceipt{}
        |> CommunityWriteReceipt.changeset(%{
          user_id: fixture.owner.id,
          idempotency_key: fixture.key,
          payload_digest: digest,
          content_type: content_type,
          content_entropy_id: record.entropy_id
        })
        |> Support.validated_row!(
          [:user_id, :idempotency_key, :payload_digest, :content_type, :content_entropy_id],
          inserted_at: anchor,
          stage: "generated #{content_type} receipt #{fixture.key}"
        )
      end)

    Repo.insert_all(CommunityWriteReceipt, rows)
    :ok
  end

  defp content_map(entries, records) do
    Enum.zip_with(entries, records, fn {fixture, _row, _digest}, record ->
      {{fixture.owner.id, fixture.key}, record}
    end)
    |> Map.new()
  end

  defp moderation_seed_fields(:pending, _moderator, _anchor) do
    %{
      moderation_status: :pending,
      moderation_note: nil,
      moderated_by: nil,
      moderated_at: nil
    }
  end

  defp moderation_seed_fields(status, moderator, anchor) do
    %{
      moderation_status: status,
      moderation_note: "Generated development moderation example",
      moderated_by: moderator.id,
      moderated_at: anchor
    }
  end

  defp existing_content_by_receipt([], _content_type, _schema), do: {%{}, MapSet.new()}

  defp existing_content_by_receipt(fixtures, content_type, schema) do
    keys = Enum.map(fixtures, & &1.key)
    owner_ids = fixtures |> Enum.map(& &1.owner.id) |> Enum.uniq()

    receipts =
      CommunityWriteReceipt
      |> where(
        [receipt],
        receipt.user_id in ^owner_ids and receipt.content_type == ^content_type and
          receipt.idempotency_key in ^keys
      )
      |> Repo.all()

    content_by_entropy_id =
      schema
      |> fetch_by_entropy_ids(Enum.map(receipts, & &1.content_entropy_id))
      |> Map.new(&{&1.entropy_id, &1})

    contents =
      Map.new(receipts, fn receipt ->
        {{receipt.user_id, receipt.idempotency_key},
         Map.get(content_by_entropy_id, receipt.content_entropy_id)}
      end)

    {contents, MapSet.new(receipts, &{&1.user_id, &1.idempotency_key})}
  end

  defp question_fixture(accounts, products, index) do
    %{
      owner: if(rem(index, 2) == 1, do: accounts.shopper, else: accounts.participant),
      answer_owner: if(rem(index, 2) == 1, do: accounts.participant, else: accounts.shopper),
      product: Enum.at(products, rem(index + 4, length(products))),
      key:
        "dev-seed-generated-question-#{String.pad_leading(Integer.to_string(index), 3, "0")}-v1",
      answer_key:
        "dev-seed-generated-answer-#{String.pad_leading(Integer.to_string(index), 3, "0")}-v1"
    }
  end

  defp question_status(index),
    do: Enum.at([:published, :pending, :hidden], rem(index - 1, 3))

  defp seed_generated_answer!(accounts, fixture, question, index, anchor) do
    body = "Deterministic development answer #{index} with practical comparison guidance."

    answer =
      CommunityWrites.answer_question(
        fixture.answer_owner.id,
        question.entropy_id,
        body,
        fixture.answer_key
      )
      |> Support.expect!("generated answer #{index}")

    status = if(rem(index, 4) == 0, do: :hidden, else: :published)
    reset_moderation? = answer.moderation_status == :removed

    answer =
      answer
      |> ThreadPost.changeset(%{body_md: body})
      |> Ecto.Changeset.change(
        moderation_status: if(reset_moderation?, do: :pending, else: answer.moderation_status),
        moderation_note: if(reset_moderation?, do: nil, else: answer.moderation_note),
        moderated_by: if(reset_moderation?, do: nil, else: answer.moderated_by),
        moderated_at: if(reset_moderation?, do: nil, else: answer.moderated_at)
      )
      |> Repo.update!()

    moderate_content!(:answer, answer, status, accounts.moderator, anchor)
  end

  defp reconcile_questions!(accounts, products, selected_count, full_count) do
    if selected_count < full_count do
      Enum.each((selected_count + 1)..full_count, fn index ->
        fixture = question_fixture(accounts, products, index)
        ensure_question_reconciliation_safe!(fixture)

        if question_status(index) == :published do
          delete_answer_receipt!(fixture.answer_owner, fixture.answer_key)
        end

        delete_receipt_content!(:question, fixture.owner, fixture.product, fixture.key)
      end)
    end
  end

  defp ensure_question_reconciliation_safe!(fixture) do
    case Repo.get_by(CommunityWriteReceipt,
           user_id: fixture.owner.id,
           content_type: :question,
           idempotency_key: fixture.key
         ) do
      nil ->
        :ok

      receipt ->
        case Repo.get_by(ProductThread, entropy_id: receipt.content_entropy_id) do
          nil -> :ok
          question -> ensure_question_has_only_seed_content!(question, fixture)
        end
    end
  end

  defp ensure_question_has_only_seed_content!(question, fixture) do
    seed_answer_entropy_ids =
      case Repo.get_by(CommunityWriteReceipt,
             user_id: fixture.answer_owner.id,
             content_type: :answer,
             idempotency_key: fixture.answer_key
           ) do
        nil -> []
        receipt -> [receipt.content_entropy_id]
      end

    post_ids =
      from post in ThreadPost,
        where: post.thread_id == ^question.id,
        select: post.id

    user_post? =
      ThreadPost
      |> where([post], post.thread_id == ^question.id)
      |> where([post], post.entropy_id not in ^seed_answer_entropy_ids)
      |> Repo.exists?()

    report? =
      CommunityReport
      |> where(
        [report],
        report.thread_id == ^question.id or report.post_id in subquery(post_ids)
      )
      |> Repo.exists?()

    if user_post? or report? do
      raise "Refusing to delete full-only question #{question.entropy_id} with user-authored posts or reports"
    end
  end

  defp moderate_content!(_type, record, :pending, _moderator, _anchor), do: record

  defp moderate_content!(
         _type,
         %{moderation_status: status} = record,
         status,
         _moderator,
         _anchor
       ),
       do: record

  defp moderate_content!(type, record, status, moderator, _anchor) do
    Discussions.moderate(
      moderator.id,
      type,
      record.entropy_id,
      status,
      "Generated development moderation example"
    )
    |> Support.expect!("moderate generated #{type}")
  end

  defp delete_answer_receipt!(owner, key) do
    case Repo.get_by(CommunityWriteReceipt,
           user_id: owner.id,
           content_type: :answer,
           idempotency_key: key
         ) do
      nil ->
        :ok

      receipt ->
        case Repo.get_by(ThreadPost, entropy_id: receipt.content_entropy_id) do
          %ThreadPost{user_id: user_id} = answer when user_id == owner.id ->
            Repo.delete!(answer)
            Repo.delete!(receipt)

          nil ->
            Repo.delete!(receipt)

          %ThreadPost{} ->
            raise "Generated answer receipt #{key} points to another owner"
        end
    end
  end

  defp delete_receipt_content!(type, owner, product, key) do
    case Repo.get_by(CommunityWriteReceipt,
           user_id: owner.id,
           content_type: type,
           idempotency_key: key
         ) do
      nil ->
        :ok

      receipt ->
        delete_receipt_record!(type, receipt, owner, product, key)
    end
  end

  defp delete_receipt_record!(:review, receipt, owner, product, key) do
    case Repo.get_by(ProductReview, entropy_id: receipt.content_entropy_id) do
      %ProductReview{user_id: user_id, product_id: product_id} = review
      when user_id == owner.id and product_id == product.id ->
        Repo.delete!(review)
        Repo.delete!(receipt)

      nil ->
        Repo.delete!(receipt)

      %ProductReview{} ->
        raise "Generated review receipt #{key} points outside its seed scope"
    end
  end

  defp delete_receipt_record!(:question, receipt, owner, product, key) do
    case Repo.get_by(ProductThread, entropy_id: receipt.content_entropy_id) do
      %ProductThread{created_by: user_id, product_id: product_id} = question
      when user_id == owner.id and product_id == product.id ->
        ThreadPost |> where([post], post.thread_id == ^question.id) |> Repo.delete_all()
        Repo.delete!(question)
        Repo.delete!(receipt)

      nil ->
        Repo.delete!(receipt)

      %ProductThread{} ->
        raise "Generated question receipt #{key} points outside its seed scope"
    end
  end

  defp seed_corrections!(accounts, catalog, selected_count) do
    full_count = @targets.full.corrections - 3
    fixtures = correction_fixtures(accounts, catalog, full_count)
    reconcile_corrections!(Enum.drop(fixtures, selected_count))

    selected =
      fixtures
      |> Enum.take(selected_count)
      |> Enum.map(fn fixture ->
        entropy_id = correction_entropy_id(fixture.index)

        correction =
          case Repo.get_by(SpecificationCorrection, entropy_id: entropy_id) do
            nil ->
              ensure_no_current_for_new_accepted_fixture!(fixture)

              Specs.propose_correction(
                fixture.product.id,
                fixture.attribute.id,
                fixture.owner.id,
                %{value_text: "Development finish correction #{fixture.index}"},
                %{
                  reason: "Generated development specification correction #{fixture.index}",
                  source_url:
                    "https://manufacturer.example/development/corrections/#{fixture.index}",
                  explanation: "Deterministic correction lifecycle coverage."
                }
              )
              |> Support.expect!("generated correction #{fixture.index}")
              |> Ecto.Changeset.change(entropy_id: entropy_id)
              |> Repo.update()
              |> Support.expect!("reserve generated correction #{fixture.index}")

            %SpecificationCorrection{} = correction ->
              verify_correction_owner!(correction, fixture)
          end

        {fixture, correction}
      end)

    preserved_scopes =
      selected
      |> Enum.map(fn {fixture, correction} ->
        %{
          product_id: fixture.product.id,
          attribute_id: fixture.attribute.id,
          claim_id: correction.claim_id
        }
      end)
      |> CorrectionSafety.preserved_current_scopes()

    Enum.map(selected, fn {fixture, correction} ->
      preserve_current? =
        fixture.status == :pending and
          MapSet.member?(preserved_scopes, {fixture.product.id, fixture.attribute.id})

      correction =
        cond do
          fixture.status == :pending and correction.status != :pending and preserve_current? ->
            correction

          fixture.status == :pending and correction.status != :pending ->
            reset_correction_to_pending!(correction, fixture)

          fixture.status == :pending or correction.status == fixture.status ->
            correction

          true ->
            Specs.moderate_correction(
              correction.id,
              accounts.moderator.id,
              fixture.status,
              %{moderation_note: "Generated development correction decision"}
            )
            |> Support.expect!("moderate generated correction #{fixture.index}")
        end

      if fixture.status == :pending and not preserve_current? do
        ProductAttributeCurrent
        |> where(
          [current],
          current.product_id == ^fixture.product.id and
            current.attribute_id == ^fixture.attribute.id
        )
        |> Repo.delete_all()
      end

      Repo.get!(SpecificationCorrection, correction.id)
    end)
  end

  defp ensure_no_current_for_new_accepted_fixture!(%{status: status})
       when status != :accepted,
       do: :ok

  defp ensure_no_current_for_new_accepted_fixture!(fixture) do
    case Repo.get_by(ProductAttributeCurrent,
           product_id: fixture.product.id,
           attribute_id: fixture.attribute.id
         ) do
      nil ->
        :ok

      %ProductAttributeCurrent{claim_id: claim_id} ->
        raise "Refusing to create generated accepted correction #{fixture.index} over unowned current claim #{claim_id}"
    end
  end

  defp correction_fixtures(accounts, catalog, count) do
    products =
      catalog.all_products
      |> Enum.drop(5)
      |> Enum.with_index(1)
      |> Enum.reject(fn {_product, specification_index} -> rem(specification_index, 17) == 0 end)
      |> Enum.map(&elem(&1, 0))

    Enum.map(1..count, fn index ->
      %{
        index: index,
        owner: if(rem(index, 2) == 1, do: accounts.shopper, else: accounts.participant),
        product: Enum.at(products, index - 1),
        attribute: catalog.attributes.finish,
        status: Enum.at([:pending, :accepted, :rejected], rem(index - 1, 3))
      }
    end)
  end

  defp reconcile_corrections!(fixtures) do
    Enum.each(fixtures, fn fixture ->
      case Repo.get_by(SpecificationCorrection, entropy_id: correction_entropy_id(fixture.index)) do
        nil ->
          :ok

        %SpecificationCorrection{} = correction ->
          verify_correction_owner!(correction, fixture)
          ensure_correction_claim_unreferenced!(correction.claim_id)

          ProductAttributeCurrent
          |> where([current], current.claim_id == ^correction.claim_id)
          |> Repo.delete_all()

          Repo.delete!(correction)

          case Repo.get(ProductAttributeClaim, correction.claim_id) do
            nil -> :ok
            claim -> Repo.delete!(claim)
          end
      end
    end)
  end

  defp ensure_correction_claim_unreferenced!(claim_id) do
    referenced? =
      ProductAttributeClaim
      |> where([claim], claim.supersedes_claim_id == ^claim_id)
      |> Repo.exists?()

    if referenced? do
      raise "Refusing to delete full-only correction claim referenced by another claim"
    end
  end

  defp verify_correction_owner!(correction, fixture) do
    if correction.submitted_by == fixture.owner.id and
         correction.product_id == fixture.product.id and
         correction.attribute_id == fixture.attribute.id do
      correction
    else
      raise "Generated correction #{fixture.index} belongs to another scope"
    end
  end

  defp reset_correction_to_pending!(correction, fixture) do
    claim = Repo.get!(ProductAttributeClaim, correction.claim_id)

    if claim.supersedes_claim_id do
      ProductAttributeClaim
      |> Repo.get!(claim.supersedes_claim_id)
      |> ProductAttributeClaim.changeset(%{status: :accepted})
      |> Repo.update()
      |> Support.expect!("restore generated superseded claim #{fixture.index}")
    end

    claim
    |> ProductAttributeClaim.changeset(%{status: :proposed})
    |> Repo.update()
    |> Support.expect!("restore generated correction claim #{fixture.index}")

    correction
    |> SpecificationCorrection.changeset(%{status: :pending})
    |> Ecto.Changeset.change(reviewed_by: nil, reviewed_at: nil, moderation_note: nil)
    |> Repo.update()
    |> Support.expect!("restore generated pending correction #{fixture.index}")
  end

  defp correction_entropy_id(index),
    do: Support.stable_uuid("development-generated-correction", Integer.to_string(index))

  defp fetch_by_entropy_ids(_schema, []), do: []

  defp fetch_by_entropy_ids(schema, entropy_ids) do
    entropy_ids
    |> Enum.chunk_every(1_000)
    |> Enum.flat_map(fn chunk ->
      schema |> where([record], record.entropy_id in ^chunk) |> Repo.all()
    end)
  end
end

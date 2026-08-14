defmodule ProductCompare.DevSeeds.GeneratedEngagement do
  @moduledoc false

  import Ecto.Query

  alias ProductCompare.Alerts
  alias ProductCompare.Catalog
  alias ProductCompare.DevSeeds.CommunityWrites
  alias ProductCompare.DevSeeds.Support
  alias ProductCompare.Discussions
  alias ProductCompare.Repo
  alias ProductCompare.Specs
  alias ProductCompareSchemas.Alerts.AlertEvent
  alias ProductCompareSchemas.Alerts.PriceWatchRule
  alias ProductCompareSchemas.Catalog.SavedComparisonSet
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

  @spec seed!(map(), map(), map(), DateTime.t(), map(), map()) :: map()
  def seed!(accounts, catalog, marketplace, anchor, profile, named) do
    targets = Map.fetch!(@targets, profile.density)

    generated_saved_sets =
      seed_saved_sets!(
        accounts.shopper,
        catalog.all_products,
        targets.saved_sets - length(named.saved_sets)
      )

    {generated_watches, watch_fixtures} =
      seed_watches!(
        accounts.shopper,
        catalog.all_products,
        marketplace,
        targets.watches - length(named.watches)
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

  defp seed_saved_sets!(shopper, products, selected_count) do
    full_count = @targets.full.saved_sets - 2
    reconcile_saved_sets!(shopper, products, selected_count, full_count)

    Enum.map(1..selected_count, fn index ->
      entropy_id = saved_set_entropy_id(index)
      product_count = 2 + rem(index, 2)

      product_ids =
        products
        |> Stream.cycle()
        |> Stream.drop(index * 3)
        |> Enum.take(product_count)
        |> Enum.map(& &1.id)

      case Repo.get_by(SavedComparisonSet, entropy_id: entropy_id) do
        nil ->
          :ok

        %SavedComparisonSet{user_id: user_id} = saved_set when user_id == shopper.id ->
          Catalog.delete_saved_comparison_set(shopper.id, saved_set.entropy_id)
          |> Support.expect!("delete generated saved comparison #{index}")

        %SavedComparisonSet{} ->
          raise "Generated saved comparison #{index} belongs to another user"
      end

      Catalog.create_saved_comparison_set(shopper.id, %{
        name: "Development comparison #{String.pad_leading(Integer.to_string(index), 2, "0")}",
        product_ids: product_ids
      })
      |> Support.expect!("generated saved comparison #{index}")
      |> Ecto.Changeset.change(entropy_id: entropy_id)
      |> Repo.update()
      |> Support.expect!("reserve generated saved comparison #{index}")
    end)
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

  defp seed_watches!(shopper, products, marketplace, selected_count) do
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

    watches =
      Enum.map(fixtures, fn fixture ->
        entropy_id = watch_entropy_id(fixture.index)
        type = Enum.at(PriceWatchRule.rule_types(), rem(fixture.index - 1, 4))
        point = hd(fixture.points)

        case Repo.get_by(PriceWatchRule, entropy_id: entropy_id) do
          nil ->
            :ok

          %PriceWatchRule{user_id: user_id} = watch when user_id == shopper.id ->
            AlertEvent |> where([event], event.watch_rule_id == ^watch.id) |> Repo.delete_all()

            Alerts.delete_watch(shopper.id, entropy_id)
            |> Support.expect!("delete generated watch #{fixture.index}")

          %PriceWatchRule{} ->
            raise "Generated watch #{fixture.index} belongs to another user"
        end

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
        |> Repo.insert()
        |> Support.expect!("generated watch #{fixture.index}")
        |> then(fn watch ->
          Repo.get!(PriceWatchRule, watch.id)
        end)
      end)

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

    watch_ids = Enum.map(watches, & &1.id)

    case AlertEvent |> where([event], event.watch_rule_id in ^watch_ids) |> Repo.all() do
      [] -> :ok
      existing -> raise "Generated watches already have #{length(existing)} alert events"
    end

    Repo.insert_all(AlertEvent, rows,
      on_conflict:
        {:replace,
         [
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
           :read_at,
           :inserted_at
         ]},
      conflict_target: [:entropy_id]
    )

    fetch_by_entropy_ids(AlertEvent, Enum.map(rows, & &1.entropy_id))
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

    Enum.map(1..selected_count, fn index ->
      %{owner: owner, product: product, key: key} = review_fixture(accounts, products, index)
      status = Enum.at([:published, :pending, :hidden], rem(index - 1, 3))

      attrs = %{
        rating: 1 + rem(index, 5),
        title: "Development review #{String.pad_leading(Integer.to_string(index), 3, "0")}",
        body: "Deterministic development review #{index} covering catalog and moderation states."
      }

      review =
        CommunityWrites.submit_review(owner.id, product.id, attrs, key)
        |> Support.expect!("generated review #{index}")

      review =
        review
        |> ProductReview.changeset(%{
          rating: attrs.rating,
          title: attrs.title,
          body_md: attrs.body
        })
        |> Ecto.Changeset.change(
          moderation_status: if(status == :pending, do: :pending, else: review.moderation_status),
          moderation_note: if(status == :pending, do: nil, else: review.moderation_note),
          moderated_by: if(status == :pending, do: nil, else: review.moderated_by),
          moderated_at: if(status == :pending, do: nil, else: review.moderated_at)
        )
        |> Repo.update!()

      moderate_content!(:review, review, status, accounts.moderator, anchor)
    end)
  end

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
        delete_receipt_content!(:review, fixture.owner, fixture.product, fixture.key)
      end)
    end
  end

  defp seed_questions!(accounts, products, anchor, selected_count) do
    full_count = @targets.full.questions - 2
    reconcile_questions!(accounts, products, selected_count, full_count)

    Enum.map(1..selected_count, fn index ->
      fixture = question_fixture(accounts, products, index)
      status = question_status(index)

      attrs = %{
        title: "Development question #{String.pad_leading(Integer.to_string(index), 3, "0")}",
        body: "Which deterministic tradeoffs matter for development product #{index}?"
      }

      question =
        CommunityWrites.ask_question(
          fixture.owner.id,
          fixture.product.id,
          attrs,
          fixture.key
        )
        |> Support.expect!("generated question #{index}")

      question =
        question
        |> ProductThread.changeset(%{title: attrs.title, body_md: attrs.body})
        |> Ecto.Changeset.change(
          moderation_status:
            if(status == :pending, do: :pending, else: question.moderation_status),
          moderation_note: if(status == :pending, do: nil, else: question.moderation_note),
          moderated_by: if(status == :pending, do: nil, else: question.moderated_by),
          moderated_at: if(status == :pending, do: nil, else: question.moderated_at)
        )
        |> Repo.update!()

      question = moderate_content!(:question, question, status, accounts.moderator, anchor)

      if status == :published do
        seed_generated_answer!(accounts, fixture, question, index, anchor)
      end

      question
    end)
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

    answer =
      answer
      |> ThreadPost.changeset(%{body_md: body})
      |> Repo.update!()

    moderate_content!(:answer, answer, status, accounts.moderator, anchor)
  end

  defp reconcile_questions!(accounts, products, selected_count, full_count) do
    if selected_count < full_count do
      Enum.each((selected_count + 1)..full_count, fn index ->
        fixture = question_fixture(accounts, products, index)

        if question_status(index) == :published do
          delete_answer_receipt!(fixture.answer_owner, fixture.answer_key)
        end

        delete_receipt_content!(:question, fixture.owner, fixture.product, fixture.key)
      end)
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

    fixtures
    |> Enum.take(selected_count)
    |> Enum.map(fn fixture ->
      entropy_id = correction_entropy_id(fixture.index)

      correction =
        case Repo.get_by(SpecificationCorrection, entropy_id: entropy_id) do
          nil ->
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

      correction =
        cond do
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

      if fixture.status == :pending do
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

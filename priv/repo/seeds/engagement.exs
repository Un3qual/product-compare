defmodule ProductCompare.DevSeeds.Engagement do
  @moduledoc false

  import Ecto.Query

  alias ProductCompare.Alerts
  alias ProductCompare.Catalog
  alias ProductCompare.ComparisonSnapshots
  alias ProductCompare.DevSeeds.Support
  alias ProductCompare.Discussions
  alias ProductCompare.Repo
  alias ProductCompare.Specs
  alias ProductCompareSchemas.Alerts.AlertEvent
  alias ProductCompareSchemas.Alerts.PriceWatchRule
  alias ProductCompareSchemas.Catalog.ComparisonSnapshot
  alias ProductCompareSchemas.Catalog.SavedComparisonSet
  alias ProductCompareSchemas.Discussions.CommunityReport
  alias ProductCompareSchemas.Discussions.ProductReview
  alias ProductCompareSchemas.Discussions.ProductThread
  alias ProductCompareSchemas.Discussions.ThreadPost
  alias ProductCompareSchemas.Pricing.PricePoint
  alias ProductCompareSchemas.Specs.ProductAttributeClaim
  alias ProductCompareSchemas.Specs.ProductAttributeCurrent
  alias ProductCompareSchemas.Specs.SpecificationCorrection

  @saved_set_names ["Gaming shortlist", "Home theater shortlist"]
  @watch_entropy_ids %{
    target: "d3ca0000-0000-4000-8000-000000000001",
    percentage_drop: "d3ca0000-0000-4000-8000-000000000002",
    back_in_stock: "d3ca0000-0000-4000-8000-000000000003",
    newly_available: "d3ca0000-0000-4000-8000-000000000004"
  }

  @spec seed!(map(), map(), map(), DateTime.t()) :: map()
  def seed!(accounts, catalog, marketplace, %DateTime{} = anchor) do
    saved_sets = seed_saved_sets!(accounts.shopper, catalog.products)
    snapshot = seed_snapshot!(accounts.shopper, catalog.products, anchor)
    alerts = seed_alerts!(accounts.shopper, catalog.products, marketplace, anchor)
    community = seed_community!(accounts, catalog.products)
    corrections = seed_corrections!(accounts, catalog)

    %{
      saved_sets: saved_sets,
      snapshot: snapshot,
      alerts: alerts,
      community: community,
      corrections: corrections
    }
  end

  defp seed_saved_sets!(shopper, products) do
    SavedComparisonSet
    |> where(
      [saved_set],
      saved_set.user_id == ^shopper.id and saved_set.name in ^@saved_set_names
    )
    |> Repo.all()
    |> Enum.each(fn saved_set ->
      Catalog.delete_saved_comparison_set(shopper.id, saved_set.entropy_id)
      |> Support.expect!("delete saved comparison #{saved_set.name}")
    end)

    %{
      gaming:
        Catalog.create_saved_comparison_set(shopper.id, %{
          name: "Gaming shortlist",
          product_ids: [
            products.monitor_16_9.id,
            products.monitor_ultrawide.id,
            products.monitor_import_feed.id
          ]
        })
        |> Support.expect!("Gaming shortlist"),
      home_theater:
        Catalog.create_saved_comparison_set(shopper.id, %{
          name: "Home theater shortlist",
          product_ids: [products.tv.id, products.projector.id]
        })
        |> Support.expect!("Home theater shortlist")
    }
  end

  defp seed_snapshot!(shopper, products, anchor) do
    snapshots =
      Repo.all(
        from snapshot in ComparisonSnapshot,
          where: snapshot.user_id == ^shopper.id and snapshot.title == "Development comparison",
          order_by: [asc: snapshot.id]
      )

    case snapshots do
      [] ->
        ComparisonSnapshots.publish(
          shopper.id,
          %{
            title: "Development comparison",
            product_ids: [products.monitor_16_9.id, products.monitor_ultrawide.id],
            recommendation_profile: :best_value,
            search_indexable: false
          },
          now: anchor
        )
        |> Support.expect!("public comparison snapshot")

      [snapshot | duplicates] ->
        snapshot =
          snapshot
          |> Ecto.Changeset.change(revoked_at: nil)
          |> Repo.update()
          |> Support.expect!("restore public comparison snapshot")

        Enum.each(duplicates, fn duplicate ->
          duplicate
          |> ComparisonSnapshot.revoke_changeset(anchor)
          |> Repo.update()
          |> Support.expect!("revoke duplicate public comparison snapshot")
        end)

        ComparisonSnapshots.hydrate(snapshot)
    end
  end

  defp seed_alerts!(shopper, products, marketplace, anchor) do
    fresh_offer = marketplace.offers.fresh
    trigger = marketplace.price_points.fresh

    target =
      recreate_seed_watch!(shopper.id, :target, %{
        product_id: products.monitor_16_9.id,
        rule_type: :target_price,
        currency: "USD",
        target_amount: "700.00",
        cooldown_seconds: 86_400
      })

    trigger
    |> PricePoint.changeset(%{
      price: Decimal.new("899.99"),
      shipping: Decimal.new("0.00"),
      in_stock: true
    })
    |> Repo.update()
    |> Support.expect!("percentage watch baseline")

    percentage_drop =
      recreate_seed_watch!(shopper.id, :percentage_drop, %{
        product_id: products.monitor_16_9.id,
        merchant_product_id: fresh_offer.id,
        rule_type: :percentage_drop,
        currency: "USD",
        percentage_drop: "20",
        cooldown_seconds: 86_400
      })

    Repo.get!(PricePoint, trigger.id)
    |> PricePoint.changeset(%{in_stock: false})
    |> Repo.update()
    |> Support.expect!("back-in-stock watch baseline")

    back_in_stock =
      recreate_seed_watch!(shopper.id, :back_in_stock, %{
        product_id: products.monitor_16_9.id,
        merchant_product_id: fresh_offer.id,
        rule_type: :back_in_stock,
        currency: "USD",
        cooldown_seconds: 86_400
      })

    # Alert setup temporarily mutates this shared observation. Restore it before operations
    # reuse its ID and values for purchase-price attribution.
    restored_trigger =
      Repo.get!(PricePoint, trigger.id)
      |> PricePoint.changeset(%{
        observed_at: trigger.observed_at,
        price: trigger.price,
        shipping: trigger.shipping,
        in_stock: trigger.in_stock,
        artifact_id: trigger.artifact_id
      })
      |> Repo.update()
      |> Support.expect!("restore alert trigger price")

    newly_available =
      recreate_seed_watch!(shopper.id, :newly_available, %{
        product_id: products.projector.id,
        merchant_product_id: marketplace.offers.unobserved.id,
        rule_type: :newly_available,
        currency: "USD",
        enabled: false,
        cooldown_seconds: 86_400
      })

    Alerts.evaluate_price_point(restored_trigger.id, now: anchor)
    |> Support.expect!("local alert evaluation")

    target_event = Repo.get_by!(AlertEvent, watch_rule_id: target.id)

    read_event =
      Alerts.mark_alert_read(shopper.id, target_event.entropy_id)
      |> Support.expect!("read alert example")

    unread_events =
      AlertEvent
      |> where(
        [event],
        event.watch_rule_id in ^[percentage_drop.id, back_in_stock.id] and
          is_nil(event.read_at)
      )
      |> order_by([event], asc: event.id)
      |> Repo.all()

    %{
      watches: %{
        target: target,
        percentage_drop: percentage_drop,
        back_in_stock: back_in_stock,
        newly_available: newly_available
      },
      read_event: read_event,
      unread_events: unread_events
    }
  end

  defp recreate_seed_watch!(shopper_id, key, attrs) do
    entropy_id = Map.fetch!(@watch_entropy_ids, key)

    case Repo.get_by(PriceWatchRule, entropy_id: entropy_id) do
      nil ->
        :ok

      %PriceWatchRule{user_id: ^shopper_id} = watch ->
        AlertEvent
        |> where([event], event.watch_rule_id == ^watch.id)
        |> Repo.delete_all()

        Alerts.delete_watch(shopper_id, entropy_id)
        |> Support.expect!("delete #{key} watch")

      %PriceWatchRule{user_id: conflicting_user_id} ->
        raise "development seed #{key} watch belongs to user #{conflicting_user_id}"
    end

    shopper_id
    |> Alerts.create_watch(attrs)
    |> Support.expect!("#{key} watch")
    |> Ecto.Changeset.change(entropy_id: entropy_id)
    |> Repo.update()
    |> Support.expect!("reserve #{key} watch")
  end

  defp seed_community!(accounts, products) do
    shopper_review =
      seed_review!(
        accounts.shopper,
        products.monitor_16_9,
        %{
          rating: 5,
          title: "Excellent for fast games",
          body: "The high refresh rate and OLED contrast make this a strong gaming display."
        },
        "dev-seed-review-shopper-v1",
        accounts.moderator,
        :published
      )

    participant_review =
      seed_review!(
        accounts.participant,
        products.tv,
        %{
          rating: 4,
          title: "Great movie picture",
          body:
            "Strong contrast and HDR make films look excellent, though bright rooms need care."
        },
        "dev-seed-review-participant-v1",
        accounts.moderator,
        :published
      )

    question =
      seed_question!(
        accounts.shopper,
        products.projector,
        %{
          title: "Which display fits a mixed gaming and movie room?",
          body:
            "I switch between competitive games and movie nights. Which tradeoffs matter most?"
        },
        "dev-seed-question-shopper-v1",
        accounts.moderator,
        :published
      )

    participant_answer =
      seed_answer!(
        accounts.participant,
        question,
        "For mixed use, prioritize refresh rate and room brightness before choosing screen size.",
        "dev-seed-answer-participant-v1",
        accounts.moderator,
        :published
      )

    hidden_answer =
      seed_answer!(
        accounts.shopper,
        question,
        "This hidden example intentionally exercises the moderation state in development.",
        "dev-seed-answer-shopper-hidden-v1",
        accounts.moderator,
        :hidden
      )

    question =
      Discussions.accept_answer(
        accounts.shopper.id,
        question.entropy_id,
        participant_answer.entropy_id
      )
      |> Support.expect!("accepted community answer")

    pending_question =
      seed_question!(
        accounts.participant,
        products.tv,
        %{
          title: "Does the OLED model work well in a bright room?",
          body: "This pending question is available for operator moderation testing."
        },
        "dev-seed-question-participant-pending-v1",
        accounts.moderator,
        :pending
      )

    report = seed_report!(accounts.participant, shopper_review)

    %{
      reviews: %{shopper: shopper_review, participant: participant_review},
      question: question,
      answers: %{participant: participant_answer, hidden: hidden_answer},
      pending_question: pending_question,
      report: report
    }
  end

  defp seed_review!(owner, product, attrs, idempotency_key, moderator, status) do
    review =
      Discussions.submit_review(owner.id, product.id, attrs, idempotency_key)
      |> Support.expect!("community review #{idempotency_key}")

    review = maybe_restore_owned!(:review, review, attrs, status)
    moderate_owned!(:review, moderator, review, status)
  end

  defp seed_question!(owner, product, attrs, idempotency_key, moderator, status) do
    question =
      Discussions.ask_question(owner.id, product.id, attrs, idempotency_key)
      |> Support.expect!("community question #{idempotency_key}")

    question = maybe_restore_owned!(:question, question, attrs, status)

    case status do
      :pending -> question
      status -> moderate_owned!(:question, moderator, question, status)
    end
  end

  defp seed_answer!(owner, question, body, idempotency_key, moderator, status) do
    answer =
      Discussions.answer_question(owner.id, question.entropy_id, body, idempotency_key)
      |> Support.expect!("community answer #{idempotency_key}")

    answer = maybe_restore_owned!(:answer, answer, %{body: body}, status)
    moderate_owned!(:answer, moderator, answer, status)
  end

  defp maybe_restore_owned!(type, record, attrs, desired_status) do
    if record.moderation_status != :removed and owned_content_matches?(type, record, attrs) and
         (desired_status != :pending or record.moderation_status == :pending) do
      record
    else
      record
      |> owned_seed_changeset(type, attrs)
      |> Ecto.Changeset.change(
        moderation_status: :pending,
        moderation_note: nil,
        moderated_by: nil,
        moderated_at: nil
      )
      |> Repo.update()
      |> Support.expect!("restore #{type} #{record.entropy_id}")
    end
  end

  defp owned_content_matches?(:review, review, attrs) do
    review.rating == attrs.rating and review.title == attrs.title and review.body_md == attrs.body
  end

  defp owned_content_matches?(:question, question, attrs) do
    question.title == attrs.title and question.body_md == attrs.body
  end

  defp owned_content_matches?(:answer, answer, attrs), do: answer.body_md == attrs.body

  defp owned_seed_changeset(%ProductReview{} = review, :review, attrs) do
    ProductReview.changeset_with_verified_purchase(
      review,
      %{rating: attrs.rating, title: attrs.title, body_md: attrs.body},
      false
    )
  end

  defp owned_seed_changeset(%ProductThread{} = question, :question, attrs),
    do: ProductThread.changeset(question, %{title: attrs.title, body_md: attrs.body})

  defp owned_seed_changeset(%ThreadPost{} = answer, :answer, attrs),
    do: ThreadPost.changeset(answer, %{body_md: attrs.body})

  defp moderate_owned!(_type, _moderator, %{moderation_status: status} = record, status),
    do: record

  defp moderate_owned!(type, moderator, record, status) do
    Discussions.moderate(
      moderator.id,
      type,
      record.entropy_id,
      status,
      "Development seed moderation example"
    )
    |> Support.expect!("moderate #{type} as #{status}")
  end

  defp seed_report!(reporter, review) do
    case Repo.get_by(CommunityReport, reporter_id: reporter.id, review_id: review.id) do
      %CommunityReport{} = report ->
        report

      nil ->
        Discussions.report(
          reporter.id,
          :review,
          review.entropy_id,
          "Development report example for the moderation queue"
        )
        |> Support.expect!("community report")
    end
  end

  defp seed_corrections!(accounts, catalog) do
    products = catalog.products
    attributes = catalog.attributes
    units = catalog.units

    pending =
      seed_correction!(
        accounts.shopper,
        products.projector,
        attributes.diagonal,
        %{value_num: Decimal.new("110"), unit_id: units.inches.id},
        %{
          reason: "Development pending correction example",
          source_url: "https://manufacturer.example/development/projector-diagonal",
          explanation: "Pending example retained for operator correction review."
        },
        :pending,
        accounts.moderator
      )

    accepted =
      seed_correction!(
        accounts.shopper,
        products.monitor_16_9,
        attributes.refresh_rate,
        %{value_num: Decimal.new("165"), unit_id: units.hz.id},
        %{
          reason: "Development accepted correction example",
          source_url: "https://manufacturer.example/development/monitor-refresh-rate",
          explanation: "Accepted example confirms the source-backed refresh rate."
        },
        :accepted,
        accounts.moderator
      )

    rejected =
      seed_correction!(
        accounts.shopper,
        products.tv,
        attributes.hdr_supported,
        %{value_bool: false},
        %{
          reason: "Development rejected correction example",
          source_url: "https://manufacturer.example/development/tv-hdr",
          explanation: "Rejected example conflicts with the accepted manufacturer evidence."
        },
        :rejected,
        accounts.moderator
      )

    %{
      pending: pending,
      accepted: accepted,
      rejected: rejected
    }
  end

  defp seed_correction!(submitter, product, attribute, typed_value, attrs, status, moderator) do
    correction =
      Repo.get_by(SpecificationCorrection,
        submitted_by: submitter.id,
        product_id: product.id,
        attribute_id: attribute.id,
        reason: attrs.reason
      ) ||
        Specs.propose_correction(product.id, attribute.id, submitter.id, typed_value, attrs)
        |> Support.expect!("#{status} correction #{product.slug}/#{attribute.code}")

    correction = restore_correction!(correction, attrs, status, product, attribute)

    correction =
      cond do
        status == :pending ->
          correction

        correction.status == status ->
          correction

        true ->
          Specs.moderate_correction(correction.id, moderator.id, status, %{
            moderation_note: "Development seed #{status} correction example"
          })
          |> Support.expect!("moderate correction #{product.slug}/#{attribute.code}")
      end

    if status == :accepted do
      Specs.select_current_claim(product.id, attribute.id, correction.claim_id, moderator.id)
      |> Support.expect!("select accepted correction #{product.slug}/#{attribute.code}")
    end

    correction
  end

  defp restore_correction!(correction, attrs, desired_status, product, attribute) do
    correction =
      if correction.status in [:accepted, :rejected] and correction.status != desired_status do
        reset_correction_to_pending!(correction, product, attribute)
      else
        correction
      end

    correction
    |> SpecificationCorrection.changeset(attrs)
    |> Repo.update()
    |> Support.expect!("restore correction #{product.slug}/#{attribute.code}")
  end

  defp reset_correction_to_pending!(correction, product, attribute) do
    claim = Repo.get!(ProductAttributeClaim, correction.claim_id)
    superseded_claim = Repo.get!(ProductAttributeClaim, claim.supersedes_claim_id)

    superseded_claim
    |> ProductAttributeClaim.changeset(%{status: :accepted})
    |> Repo.update()
    |> Support.expect!("restore superseded claim #{product.slug}/#{attribute.code}")

    case Repo.get_by(ProductAttributeCurrent,
           product_id: correction.product_id,
           attribute_id: correction.attribute_id
         ) do
      nil ->
        :ok

      current ->
        current
        |> ProductAttributeCurrent.changeset(%{claim_id: superseded_claim.id})
        |> Repo.update()
        |> Support.expect!("restore current claim #{product.slug}/#{attribute.code}")
    end

    claim
    |> ProductAttributeClaim.changeset(%{status: :proposed})
    |> Repo.update()
    |> Support.expect!("restore correction claim #{product.slug}/#{attribute.code}")

    correction
    |> SpecificationCorrection.changeset(%{status: :pending})
    |> Ecto.Changeset.change(reviewed_by: nil, reviewed_at: nil, moderation_note: nil)
    |> Repo.update()
    |> Support.expect!("restore pending correction #{product.slug}/#{attribute.code}")
  end
end

defmodule ProductCompare.DevSeeds.Engagement do
  @moduledoc false

  import Ecto.Query

  alias ProductCompare.Alerts
  alias ProductCompare.Catalog
  alias ProductCompare.ComparisonSnapshots
  alias ProductCompare.DevSeeds.CommunityWrites
  alias ProductCompare.DevSeeds.CorrectionSafety
  alias ProductCompare.DevSeeds.Support
  alias ProductCompare.Discussions
  alias ProductCompare.Pricing
  alias ProductCompare.Repo
  alias ProductCompare.Specs
  alias ProductCompareSchemas.Alerts.AlertEvent
  alias ProductCompareSchemas.Alerts.PriceWatchRule
  alias ProductCompareSchemas.Catalog.ComparisonSnapshot
  alias ProductCompareSchemas.Catalog.SavedComparisonSet
  alias ProductCompareSchemas.Discussions.CommunityWriteReceipt
  alias ProductCompareSchemas.Discussions.ProductReview
  alias ProductCompareSchemas.Discussions.ProductThread
  alias ProductCompareSchemas.Discussions.ThreadPost
  alias ProductCompareSchemas.Pricing.PricePoint
  alias ProductCompareSchemas.Specs.ProductAttributeClaim
  alias ProductCompareSchemas.Specs.ProductAttributeCurrent
  alias ProductCompareSchemas.Specs.SpecificationCorrection

  @saved_set_entropy_ids %{
    gaming: "d3ca0000-0000-4000-8000-000000000101",
    home_theater: "d3ca0000-0000-4000-8000-000000000102"
  }
  @snapshot_entropy_id "d3ca0000-0000-4000-8000-000000000103"
  @correction_entropy_ids %{
    pending: "d3ca0000-0000-4000-8000-000000000301",
    accepted: "d3ca0000-0000-4000-8000-000000000302",
    rejected: "d3ca0000-0000-4000-8000-000000000303"
  }
  @watch_entropy_ids %{
    target: "d3ca0000-0000-4000-8000-000000000001",
    percentage_drop: "d3ca0000-0000-4000-8000-000000000002",
    back_in_stock: "d3ca0000-0000-4000-8000-000000000003",
    newly_available: Support.unobserved_watch_entropy_id()
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
    %{
      gaming:
        recreate_seed_saved_set!(shopper.id, :gaming, %{
          name: "Gaming shortlist",
          product_ids: [
            products.monitor_16_9.id,
            products.monitor_ultrawide.id,
            products.monitor_import_feed.id
          ]
        }),
      home_theater:
        recreate_seed_saved_set!(shopper.id, :home_theater, %{
          name: "Home theater shortlist",
          product_ids: [products.tv.id, products.projector.id]
        })
    }
  end

  defp recreate_seed_saved_set!(shopper_id, key, attrs) do
    entropy_id = Map.fetch!(@saved_set_entropy_ids, key)

    case Repo.get_by(SavedComparisonSet, entropy_id: entropy_id) do
      nil ->
        :ok

      %SavedComparisonSet{user_id: ^shopper_id} = saved_set ->
        Catalog.delete_saved_comparison_set(shopper_id, saved_set.entropy_id)
        |> Support.expect!("delete saved comparison #{saved_set.name}")

      %SavedComparisonSet{user_id: conflicting_user_id} ->
        raise "development seed #{key} saved comparison belongs to user #{conflicting_user_id}"
    end

    shopper_id
    |> Catalog.create_saved_comparison_set(attrs)
    |> Support.expect!(attrs.name)
    |> Ecto.Changeset.change(entropy_id: entropy_id)
    |> Repo.update()
    |> Support.expect!("reserve #{key} saved comparison")
  end

  defp seed_snapshot!(shopper, products, anchor) do
    case Repo.get_by(ComparisonSnapshot, entropy_id: @snapshot_entropy_id) do
      nil ->
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
        |> Ecto.Changeset.change(entropy_id: @snapshot_entropy_id)
        |> Repo.update()
        |> Support.expect!("reserve public comparison snapshot")
        |> ComparisonSnapshots.hydrate()

      %ComparisonSnapshot{user_id: shopper_id} when shopper_id != shopper.id ->
        raise "development seed comparison snapshot belongs to user #{shopper_id}"

      %ComparisonSnapshot{} = snapshot ->
        snapshot =
          snapshot
          |> Ecto.Changeset.change(revoked_at: nil)
          |> Repo.update()
          |> Support.expect!("restore public comparison snapshot")

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

    # Watch creation and evaluation read the listing's latest observation. Temporarily
    # promote this seed-owned point so preserved later local history cannot replace the
    # controlled baselines, then restore both the point and copied event timestamp.
    latest_observed_at =
      fresh_offer.id
      |> Pricing.latest_price()
      |> Map.fetch!(:observed_at)

    current_observed_at = DateTime.utc_now() |> DateTime.truncate(:microsecond)

    controlled_observed_at =
      case DateTime.compare(latest_observed_at, current_observed_at) do
        :lt -> current_observed_at
        _ -> DateTime.add(latest_observed_at, 1, :microsecond)
      end

    {percentage_drop, back_in_stock, reserved_watch_ids} =
      try do
        trigger
        |> PricePoint.changeset(%{
          observed_at: controlled_observed_at,
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

        controlled_trigger =
          Repo.get!(PricePoint, trigger.id)
          |> PricePoint.changeset(%{
            price: trigger.price,
            shipping: trigger.shipping,
            in_stock: trigger.in_stock,
            artifact_id: trigger.artifact_id
          })
          |> Repo.update()
          |> Support.expect!("alert trigger price")

        reserved_watch_ids = [target.id, percentage_drop.id, back_in_stock.id]
        reserved_watch_id_set = MapSet.new(reserved_watch_ids)

        Alerts.evaluate_price_point(controlled_trigger.id,
          now: anchor,
          watch_evaluator: fn watch_id, price_point, now, evaluate ->
            if MapSet.member?(reserved_watch_id_set, watch_id) do
              evaluate.(watch_id, price_point, now)
            else
              {:ok, false}
            end
          end
        )
        |> Support.expect!("local alert evaluation")

        {percentage_drop, back_in_stock, reserved_watch_ids}
      after
        restore_alert_trigger!(trigger)
      end

    restore_seed_alert_event_observation!(reserved_watch_ids, trigger)

    newly_available =
      recreate_seed_watch!(shopper.id, :newly_available, %{
        product_id: products.projector.id,
        merchant_product_id: marketplace.offers.unobserved.id,
        rule_type: :newly_available,
        currency: "USD",
        enabled: false,
        cooldown_seconds: 86_400
      })

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

  defp restore_alert_trigger!(trigger) do
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
  end

  defp restore_seed_alert_event_observation!(watch_ids, trigger) do
    AlertEvent
    |> where(
      [event],
      event.watch_rule_id in ^watch_ids and event.triggering_price_point_id == ^trigger.id
    )
    |> Repo.update_all(set: [observed_at: trigger.observed_at])
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
    case occupied_active_review(owner.id, product.id, idempotency_key) do
      %ProductReview{} = review ->
        review

      nil ->
        review =
          CommunityWrites.submit_review(owner.id, product.id, attrs, idempotency_key)
          |> Support.expect!("community review #{idempotency_key}")

        case active_replacement_review(review) do
          %ProductReview{} = replacement ->
            replacement

          nil ->
            review = maybe_restore_owned!(:review, review, attrs, status)
            moderate_owned!(:review, moderator, review, status)
        end
    end
  end

  defp occupied_active_review(user_id, product_id, idempotency_key) do
    case active_review_in_scope(user_id, product_id) do
      nil ->
        nil

      %ProductReview{} = review ->
        case Repo.get_by(CommunityWriteReceipt,
               user_id: user_id,
               content_type: :review,
               idempotency_key: idempotency_key
             ) do
          %CommunityWriteReceipt{content_entropy_id: entropy_id}
          when entropy_id == review.entropy_id ->
            nil

          _unowned_or_missing_receipt ->
            review
        end
    end
  end

  defp active_review_in_scope(user_id, product_id) do
    Repo.one(
      from review in ProductReview,
        where:
          review.user_id == ^user_id and review.product_id == ^product_id and
            review.moderation_status != :removed
    )
  end

  defp active_replacement_review(%ProductReview{moderation_status: :removed} = review),
    do: active_review_in_scope(review.user_id, review.product_id)

  defp active_replacement_review(%ProductReview{}), do: nil

  defp seed_question!(owner, product, attrs, idempotency_key, moderator, status) do
    question =
      CommunityWrites.ask_question(owner.id, product.id, attrs, idempotency_key)
      |> Support.expect!("community question #{idempotency_key}")

    question = maybe_restore_owned!(:question, question, attrs, status)

    case status do
      :pending -> question
      status -> moderate_owned!(:question, moderator, question, status)
    end
  end

  defp seed_answer!(owner, question, body, idempotency_key, moderator, status) do
    answer =
      CommunityWrites.answer_question(owner.id, question.entropy_id, body, idempotency_key)
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
    CommunityWrites.report(
      reporter.id,
      :review,
      review.entropy_id,
      "Development report example for the moderation queue"
    )
    |> Support.expect!("community report")
  end

  defp seed_corrections!(accounts, catalog) do
    products = catalog.products
    attributes = catalog.attributes
    units = catalog.units

    pending =
      seed_correction!(
        :pending,
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
        :accepted,
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
        :rejected,
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

  defp seed_correction!(
         key,
         submitter,
         product,
         attribute,
         typed_value,
         attrs,
         status,
         moderator
       ) do
    case ensure_seed_correction!(key, submitter, product, attribute, typed_value, attrs, status) do
      {:managed, correction} ->
        restore_seed_correction!(correction, attrs, status, product, attribute, moderator)

      {:occupied, correction} ->
        correction
    end
  end

  defp ensure_seed_correction!(key, submitter, product, attribute, typed_value, attrs, status) do
    entropy_id = Map.fetch!(@correction_entropy_ids, key)

    case Repo.get_by(SpecificationCorrection, entropy_id: entropy_id) do
      nil ->
        case pending_correction_in_scope(submitter, product, attribute) do
          %SpecificationCorrection{} = correction when status == :pending ->
            {:occupied, correction}

          %SpecificationCorrection{} = correction ->
            raise "development seed cannot create #{status} correction #{product.slug}/#{attribute.code}: pending correction #{correction.id} already occupies the submitter scope"

          nil ->
            correction =
              Specs.propose_correction(product.id, attribute.id, submitter.id, typed_value, attrs)
              |> Support.expect!("#{status} correction #{product.slug}/#{attribute.code}")

            correction =
              correction
              |> Ecto.Changeset.change(entropy_id: entropy_id)
              |> Repo.update()
              |> Support.expect!("reserve #{key} correction #{product.slug}/#{attribute.code}")

            {:managed, correction}
        end

      %SpecificationCorrection{} = correction ->
        {:managed, ensure_correction_owner!(correction, submitter, product, attribute, key)}
    end
  end

  defp pending_correction_in_scope(submitter, product, attribute) do
    SpecificationCorrection
    |> where(
      [correction],
      correction.submitted_by == ^submitter.id and correction.product_id == ^product.id and
        correction.attribute_id == ^attribute.id and correction.status == :pending
    )
    |> Repo.one()
  end

  defp restore_seed_correction!(correction, attrs, status, product, attribute, moderator) do
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

    if status == :accepted and
         not CorrectionSafety.preserve_current_for_pending?(
           product.id,
           attribute.id,
           correction.claim_id
         ) do
      restore_accepted_correction_claim!(correction, product, attribute)

      Specs.select_current_claim(product.id, attribute.id, correction.claim_id, moderator.id)
      |> Support.expect!("select accepted correction #{product.slug}/#{attribute.code}")
    end

    correction
  end

  defp ensure_correction_owner!(correction, submitter, product, attribute, key) do
    if correction.submitted_by == submitter.id and correction.product_id == product.id and
         correction.attribute_id == attribute.id do
      correction
    else
      raise "development seed #{key} correction belongs to another correction scope"
    end
  end

  defp restore_correction!(correction, attrs, desired_status, product, attribute) do
    correction =
      if correction.status in [:accepted, :rejected] and correction.status != desired_status and
           not CorrectionSafety.preserve_current_for_pending?(
             correction.product_id,
             correction.attribute_id,
             correction.claim_id
           ) do
        reset_correction_to_pending!(correction, product, attribute)
      else
        correction
      end

    correction
    |> SpecificationCorrection.changeset(attrs)
    |> Repo.update()
    |> Support.expect!("restore correction #{product.slug}/#{attribute.code}")
  end

  defp restore_accepted_correction_claim!(correction, product, attribute) do
    case Repo.get!(ProductAttributeClaim, correction.claim_id) do
      %ProductAttributeClaim{status: :accepted} ->
        :ok

      claim ->
        claim
        |> ProductAttributeClaim.changeset(%{status: :accepted})
        |> Repo.update()
        |> Support.expect!("restore accepted correction claim #{product.slug}/#{attribute.code}")

        :ok
    end
  end

  defp reset_correction_to_pending!(correction, product, attribute) do
    claim = Repo.get!(ProductAttributeClaim, correction.claim_id)

    if claim.supersedes_claim_id do
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
    else
      case Repo.get_by(ProductAttributeCurrent,
             product_id: correction.product_id,
             attribute_id: correction.attribute_id
           ) do
        %ProductAttributeCurrent{claim_id: claim_id} = current when claim_id == claim.id ->
          current
          |> Repo.delete()
          |> Support.expect!("clear current correction claim #{product.slug}/#{attribute.code}")

        _other_current_or_none ->
          :ok
      end
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

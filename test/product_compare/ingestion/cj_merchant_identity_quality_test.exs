defmodule ProductCompare.Ingestion.CJMerchantIdentityQualityTest do
  use ProductCompare.DataCase, async: false

  import ProductCompare.Fixtures.CJIngestionFixtures

  alias ProductCompare.Ingestion.CJMerchantIdentityQuality
  alias ProductCompare.Repo
  alias ProductCompareSchemas.Ingestion.MerchantSourceIdentity
  alias ProductCompareSchemas.Pricing.Merchant

  describe "summary/1" do
    test "returns zero counts when the CJ source is missing" do
      assert %{
               provider: "cj",
               duplicate_example_limit: 5,
               identity_count: 0,
               missing_merchant_name_count: 0,
               missing_merchant_domain_count: 0,
               duplicate_domain_count: 0,
               duplicate_name_count: 0,
               duplicate_domains: [],
               duplicate_merchant_names: []
             } = CJMerchantIdentityQuality.summary()
    end

    test "summarizes CJ merchant identity completeness and duplicate examples" do
      cj_source = source_fixture(%{kind: "affiliate_feed", name: "CJ", domain: "cj.com"})
      other_source = source_fixture(%{name: "Other source"})

      unique = merchant_fixture(%{name: "Unique Merchant", domain: "unique.example"})

      missing_name =
        merchant_fixture(%{name: "Missing Name Merchant", domain: "missing-name.example"})

      missing_domain =
        merchant_fixture(%{name: "Missing Domain Merchant", domain: "missing-domain.example"})

      domain_one = merchant_fixture(%{name: "Domain One", domain: "domain-one.example"})
      domain_two = merchant_fixture(%{name: "Domain Two", domain: "domain-two.example"})
      name_one = merchant_fixture(%{name: "Name One", domain: "name-one.example"})
      name_two = merchant_fixture(%{name: "Name Two", domain: "name-two.example"})
      other = merchant_fixture(%{name: "Other Merchant", domain: "other.example"})

      merchant_source_identity_fixture(cj_source, unique, %{
        merchant_name: "Unique Merchant",
        merchant_domain: "unique.example"
      })

      merchant_source_identity_fixture(cj_source, missing_name, %{
        merchant_name: " ",
        merchant_domain: "missing-name.example"
      })

      merchant_source_identity_fixture(cj_source, missing_domain, %{
        merchant_name: "Missing Domain Merchant",
        merchant_domain: nil
      })

      domain_duplicate_a =
        merchant_source_identity_fixture(cj_source, domain_one, %{
          merchant_name: "Domain One",
          merchant_domain: " Example.COM "
        })

      domain_duplicate_b =
        merchant_source_identity_fixture(cj_source, domain_two, %{
          merchant_name: "Domain Two",
          merchant_domain: "example.com"
        })

      name_duplicate_a =
        merchant_source_identity_fixture(cj_source, name_one, %{
          merchant_name: " Shared Name ",
          merchant_domain: "name-one.example"
        })

      name_duplicate_b =
        merchant_source_identity_fixture(cj_source, name_two, %{
          merchant_name: "shared name",
          merchant_domain: "name-two.example"
        })

      merchant_source_identity_fixture(other_source, other, %{
        merchant_name: nil,
        merchant_domain: "example.com"
      })

      assert %{
               provider: "cj",
               duplicate_example_limit: 5,
               identity_count: 7,
               missing_merchant_name_count: 1,
               missing_merchant_domain_count: 1,
               duplicate_domain_count: 1,
               duplicate_name_count: 1,
               duplicate_domains: [
                 %{
                   domain: "example.com",
                   identity_count: 2,
                   identities: domain_identities
                 }
               ],
               duplicate_merchant_names: [
                 %{
                   merchant_name: "shared name",
                   identity_count: 2,
                   identities: name_identities
                 }
               ]
             } = summary = CJMerchantIdentityQuality.summary()

      assert Enum.map(domain_identities, & &1.id) == [
               domain_duplicate_a.id,
               domain_duplicate_b.id
             ]

      assert Enum.map(name_identities, & &1.id) == [name_duplicate_a.id, name_duplicate_b.id]
      assert_safe_summary(summary)
    end

    test "normalizes duplicate example limits" do
      cj_source = source_fixture(%{kind: "affiliate_feed", name: "CJ", domain: "cj.com"})

      Enum.each(1..3, fn index ->
        merchant =
          merchant_fixture(%{name: "Duplicate Merchant #{index}", domain: "dup-#{index}.example"})

        merchant_source_identity_fixture(cj_source, merchant, %{
          merchant_name: "Duplicate Merchant #{index}",
          merchant_domain: "duplicate.example"
        })
      end)

      assert %{duplicate_example_limit: 5} = CJMerchantIdentityQuality.summary()

      assert %{duplicate_example_limit: 1, duplicate_domains: [%{identities: [_one]}]} =
               CJMerchantIdentityQuality.summary(duplicate_example_limit: 0)

      assert %{duplicate_example_limit: 25} =
               CJMerchantIdentityQuality.summary(duplicate_example_limit: 100)

      assert %{duplicate_example_limit: 2, duplicate_domains: [%{identities: [_, _]}]} =
               CJMerchantIdentityQuality.summary(%{"duplicate_example_limit" => "2"})

      assert %{duplicate_example_limit: 5} =
               CJMerchantIdentityQuality.summary(duplicate_example_limit: "bad")
    end

    test "uses duplicate example limit for groups and identities while counting all groups" do
      cj_source = source_fixture(%{kind: "affiliate_feed", name: "CJ", domain: "cj.com"})

      Enum.each(1..3, fn group_index ->
        Enum.each(1..3, fn identity_index ->
          merchant =
            merchant_fixture(%{
              name: "Duplicate Group #{group_index} Merchant #{identity_index}",
              domain: "duplicate-group-#{group_index}-#{identity_index}.example"
            })

          merchant_source_identity_fixture(cj_source, merchant, %{
            merchant_name: "Duplicate Group #{group_index} Merchant #{identity_index}",
            merchant_domain: "duplicate-group-#{group_index}.example"
          })
        end)
      end)

      assert %{
               duplicate_example_limit: 2,
               duplicate_domain_count: 3,
               duplicate_domains: duplicate_domains
             } = CJMerchantIdentityQuality.summary(duplicate_example_limit: 2)

      assert length(duplicate_domains) == 2
      assert Enum.all?(duplicate_domains, &(&1.identity_count == 3))
      assert Enum.all?(duplicate_domains, &(length(&1.identities) == 2))
    end

    test "batches duplicate identity examples for selected groups" do
      cj_source = source_fixture(%{kind: "affiliate_feed", name: "CJ", domain: "cj.com"})

      Enum.each(1..4, fn group_index ->
        Enum.each(1..3, fn identity_index ->
          merchant =
            merchant_fixture(%{
              name: "Batch Duplicate #{group_index} Merchant #{identity_index}",
              domain: "batch-duplicate-#{group_index}-#{identity_index}.example"
            })

          merchant_source_identity_fixture(cj_source, merchant, %{
            merchant_name: "Batch Duplicate #{group_index} Merchant #{identity_index}",
            merchant_domain: "batch-duplicate-#{group_index}.example"
          })
        end)
      end)

      {summary, select_queries} =
        capture_select_queries(fn ->
          CJMerchantIdentityQuality.summary(duplicate_example_limit: 3)
        end)

      assert %{
               duplicate_domain_count: 4,
               duplicate_domains: duplicate_domains
             } = summary

      assert length(duplicate_domains) == 3
      assert Enum.all?(duplicate_domains, &(length(&1.identities) == 3))

      assert Enum.count(select_queries, &windowed_identity_query?/1) == 1
    end

    test "does not mutate merchant identity rows" do
      cj_source = source_fixture(%{kind: "affiliate_feed", name: "CJ", domain: "cj.com"})
      merchant = merchant_fixture(%{name: "Read Only Merchant", domain: "read-only.example"})

      identity =
        merchant_source_identity_fixture(cj_source, merchant, %{
          merchant_name: "Read Only Merchant",
          merchant_domain: "read-only.example"
        })

      before_summary = Repo.get!(MerchantSourceIdentity, identity.id)

      assert %{identity_count: 1} = CJMerchantIdentityQuality.summary()

      after_summary = Repo.get!(MerchantSourceIdentity, identity.id)

      assert after_summary.merchant_name == before_summary.merchant_name
      assert after_summary.merchant_domain == before_summary.merchant_domain
      assert DateTime.compare(after_summary.last_seen_at, before_summary.last_seen_at) == :eq
    end
  end

  defp merchant_fixture(attrs) do
    suffix = System.unique_integer([:positive])

    attrs =
      Map.merge(
        %{
          name: "Merchant #{suffix}",
          domain: "merchant-#{suffix}.example"
        },
        attrs
      )

    %Merchant{}
    |> Merchant.changeset(attrs)
    |> Repo.insert!()
  end

  defp merchant_source_identity_fixture(source, merchant, attrs) do
    suffix = System.unique_integer([:positive])

    attrs =
      Map.merge(
        %{
          source_id: source.id,
          merchant_id: merchant.id,
          merchant_identifier: "merchant-#{suffix}",
          merchant_name: merchant.name,
          merchant_domain: merchant.domain,
          last_seen_at: ~U[2026-07-01 12:00:00Z]
        },
        attrs
      )

    %MerchantSourceIdentity{}
    |> MerchantSourceIdentity.changeset(attrs)
    |> Repo.insert!()
  end

  defp assert_safe_summary(summary) do
    summary_keys = summary |> Map.keys() |> MapSet.new()

    assert MapSet.disjoint?(
             summary_keys,
             MapSet.new([:merchant_identifier, :raw_json, :raw_metadata, :tracking_params])
           )

    Enum.each(summary.duplicate_domains ++ summary.duplicate_merchant_names, fn duplicate ->
      duplicate_keys = duplicate |> Map.keys() |> MapSet.new()
      assert MapSet.disjoint?(duplicate_keys, MapSet.new([:merchant_identifier, :raw_metadata]))

      Enum.each(duplicate.identities, fn identity ->
        identity_keys = identity |> Map.keys() |> MapSet.new()
        assert identity_keys == MapSet.new([:id, :merchant_name, :merchant_domain])
      end)
    end)
  end

  defp capture_select_queries(fun) do
    handler_id = {__MODULE__, System.unique_integer([:positive])}
    ref = make_ref()
    test_pid = self()

    :ok =
      :telemetry.attach(
        handler_id,
        [:product_compare, :repo, :query],
        fn _event, _measurements, metadata, {pid, message_ref} ->
          if select_query?(metadata.query) do
            send(pid, {message_ref, metadata.query})
          end
        end,
        {test_pid, ref}
      )

    try do
      result = fun.()
      {result, drain_queries(ref, [])}
    after
      :telemetry.detach(handler_id)
    end
  end

  defp drain_queries(ref, acc) do
    receive do
      {^ref, query} -> drain_queries(ref, [query | acc])
    after
      0 -> Enum.reverse(acc)
    end
  end

  defp select_query?(query) when is_binary(query) do
    query
    |> String.trim_leading()
    |> String.upcase()
    |> String.starts_with?("SELECT")
  end

  defp windowed_identity_query?(query) do
    query
    |> String.downcase()
    |> String.contains?("row_number() over")
  end
end

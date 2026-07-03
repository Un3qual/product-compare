defmodule ProductCompare.Ingestion.CJMerchantIdentityQualityTest do
  use ProductCompare.DataCase, async: true

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
end

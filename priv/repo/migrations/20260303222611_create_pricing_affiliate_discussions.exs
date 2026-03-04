defmodule ProductCompare.Repo.Migrations.CreatePricingAffiliateDiscussions do
  use Ecto.Migration

  def change do
    create table(:merchants) do
      add :entropy_id, :uuid, null: false, default: fragment("uuidv7()")
      add :name, :text, null: false
      add :domain, :text

      timestamps(type: :utc_datetime_usec)
    end

    create unique_index(:merchants, [:name])
    create unique_index(:merchants, [:entropy_id])

    create table(:merchant_products) do
      add :entropy_id, :uuid, null: false, default: fragment("uuidv7()")
      add :merchant_id, references(:merchants, type: :bigint, on_delete: :delete_all), null: false
      add :product_id, references(:products, type: :bigint, on_delete: :delete_all), null: false
      add :external_sku, :text
      add :url, :text, null: false
      add :currency, :string, size: 3, null: false
      add :last_seen_at, :utc_datetime_usec, null: false, default: fragment("now()")
      add :is_active, :boolean, null: false, default: true

      timestamps(type: :utc_datetime_usec)
    end

    create unique_index(:merchant_products, [:merchant_id, :url],
             name: :merchant_products_merchant_url_uq
           )

    create index(:merchant_products, [:product_id], name: :merchant_products_product_idx)
    create unique_index(:merchant_products, [:entropy_id])

    create table(:price_points) do
      add :entropy_id, :uuid, null: false, default: fragment("uuidv7()")

      add :merchant_product_id,
          references(:merchant_products, type: :bigint, on_delete: :delete_all), null: false

      add :observed_at, :utc_datetime_usec, null: false, default: fragment("now()")
      add :price, :decimal, null: false
      add :shipping, :decimal
      add :in_stock, :boolean
      add :artifact_id, references(:source_artifacts, type: :bigint, on_delete: :nilify_all)

      timestamps(type: :utc_datetime_usec, updated_at: false)
    end

    create index(:price_points, [:merchant_product_id, :observed_at],
             name: :price_points_mp_time_idx
           )

    create unique_index(:price_points, [:entropy_id])

    create constraint(:price_points, :price_must_be_non_negative, check: "price >= 0")

    create constraint(:price_points, :shipping_must_be_non_negative,
             check: "shipping IS NULL OR shipping >= 0"
           )

    create table(:affiliate_networks) do
      add :entropy_id, :uuid, null: false, default: fragment("uuidv7()")
      add :name, :text, null: false

      timestamps(type: :utc_datetime_usec)
    end

    create unique_index(:affiliate_networks, [:name])
    create unique_index(:affiliate_networks, [:entropy_id])

    create table(:affiliate_programs) do
      add :entropy_id, :uuid, null: false, default: fragment("uuidv7()")

      add :affiliate_network_id,
          references(:affiliate_networks, type: :bigint, on_delete: :delete_all), null: false

      add :merchant_id, references(:merchants, type: :bigint, on_delete: :delete_all), null: false
      add :program_code, :text
      add :status, :text

      timestamps(type: :utc_datetime_usec)
    end

    create unique_index(:affiliate_programs, [:affiliate_network_id, :merchant_id],
             name: :affiliate_programs_net_merchant_uq
           )

    create unique_index(:affiliate_programs, [:entropy_id])

    create table(:affiliate_links) do
      add :entropy_id, :uuid, null: false, default: fragment("uuidv7()")

      add :merchant_product_id,
          references(:merchant_products, type: :bigint, on_delete: :delete_all), null: false

      add :affiliate_network_id,
          references(:affiliate_networks, type: :bigint, on_delete: :nilify_all)

      add :original_url, :text, null: false
      add :affiliate_url, :text, null: false
      add :last_verified_at, :utc_datetime_usec

      timestamps(type: :utc_datetime_usec)
    end

    create unique_index(:affiliate_links, [:merchant_product_id],
             name: :affiliate_links_merchant_product_uq
           )

    create unique_index(:affiliate_links, [:entropy_id])

    create table(:coupons) do
      add :entropy_id, :uuid, null: false, default: fragment("uuidv7()")
      add :merchant_id, references(:merchants, type: :bigint, on_delete: :delete_all), null: false

      add :affiliate_network_id,
          references(:affiliate_networks, type: :bigint, on_delete: :nilify_all)

      add :code, :text, null: false
      add :description, :text
      add :discount_type, :string, null: false, default: "other"
      add :discount_value, :decimal
      add :currency, :string, size: 3
      add :valid_from, :utc_datetime_usec
      add :valid_to, :utc_datetime_usec
      add :terms, :text
      add :artifact_id, references(:source_artifacts, type: :bigint, on_delete: :nilify_all)

      timestamps(type: :utc_datetime_usec)
    end

    create index(:coupons, [:merchant_id, :valid_to], name: :coupons_merchant_validto_idx)
    create unique_index(:coupons, [:entropy_id])

    create constraint(:coupons, :coupons_discount_type_check,
             check: "discount_type IN ('percent', 'amount', 'free_shipping', 'other')"
           )

    create constraint(:coupons, :coupons_discount_shape_check,
             check: """
             (
               (discount_type = 'percent' AND discount_value IS NOT NULL AND discount_value >= 0 AND discount_value <= 100) OR
               (discount_type = 'amount' AND discount_value IS NOT NULL AND discount_value >= 0 AND currency IS NOT NULL) OR
               (discount_type IN ('free_shipping', 'other') AND discount_value IS NULL)
             )
             """
           )

    create constraint(:coupons, :coupons_validity_window_check,
             check: "valid_to IS NULL OR valid_from IS NULL OR valid_to >= valid_from"
           )

    create table(:product_threads) do
      add :entropy_id, :uuid, null: false, default: fragment("uuidv7()")
      add :product_id, references(:products, type: :bigint, on_delete: :delete_all), null: false
      add :title, :text, null: false
      add :created_by, references(:users, type: :bigint, on_delete: :nilify_all)

      timestamps(type: :utc_datetime_usec, updated_at: false)
    end

    create index(:product_threads, [:product_id, :inserted_at],
             name: :product_threads_product_time_idx
           )

    create unique_index(:product_threads, [:entropy_id])

    create table(:thread_posts) do
      add :entropy_id, :uuid, null: false, default: fragment("uuidv7()")

      add :thread_id, references(:product_threads, type: :bigint, on_delete: :delete_all),
        null: false

      add :parent_post_id, references(:thread_posts, type: :bigint, on_delete: :nilify_all)
      add :user_id, references(:users, type: :bigint, on_delete: :nilify_all)
      add :body_md, :text, null: false

      timestamps(type: :utc_datetime_usec)
    end

    create index(:thread_posts, [:thread_id, :inserted_at], name: :thread_posts_thread_time_idx)
    create index(:thread_posts, [:parent_post_id], name: :thread_posts_parent_idx)
    create unique_index(:thread_posts, [:entropy_id])

    create constraint(:thread_posts, :thread_posts_parent_not_self_check,
             check: "parent_post_id IS NULL OR parent_post_id <> id"
           )

    execute(
      """
      CREATE FUNCTION thread_posts_parent_thread_guard()
      RETURNS trigger AS $$
      DECLARE
        parent_thread_id bigint;
        cycle_detected boolean;
      BEGIN
        IF NEW.parent_post_id IS NULL THEN
          RETURN NEW;
        END IF;

        IF NEW.parent_post_id = NEW.id THEN
          RAISE EXCEPTION 'parent_post_id cannot reference the post itself'
            USING ERRCODE = 'check_violation';
        END IF;

        SELECT thread_id
        INTO parent_thread_id
        FROM thread_posts
        WHERE id = NEW.parent_post_id;

        IF parent_thread_id IS NULL THEN
          RETURN NEW;
        END IF;

        IF parent_thread_id <> NEW.thread_id THEN
          RAISE EXCEPTION 'parent_post_id must reference a post in the same thread'
            USING ERRCODE = 'check_violation';
        END IF;

        WITH RECURSIVE parent_chain(id, parent_post_id, path) AS (
          SELECT tp.id, tp.parent_post_id, ARRAY[tp.id]
          FROM thread_posts tp
          WHERE tp.id = NEW.parent_post_id
          UNION ALL
          SELECT tp.id, tp.parent_post_id, pc.path || tp.id
          FROM thread_posts tp
          JOIN parent_chain pc ON tp.id = pc.parent_post_id
          WHERE NOT tp.id = ANY(pc.path)
        )
        SELECT EXISTS(
          SELECT 1
          FROM parent_chain
          WHERE id = NEW.id
        )
        INTO cycle_detected;

        IF cycle_detected THEN
          RAISE EXCEPTION 'parent_post_id cannot create a cycle'
            USING ERRCODE = 'check_violation';
        END IF;

        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
      """,
      """
      DROP FUNCTION IF EXISTS thread_posts_parent_thread_guard();
      """
    )

    execute(
      """
      CREATE TRIGGER thread_posts_parent_thread_guard_tg
      BEFORE INSERT OR UPDATE OF thread_id, parent_post_id ON thread_posts
      FOR EACH ROW
      EXECUTE FUNCTION thread_posts_parent_thread_guard();
      """,
      """
      DROP TRIGGER IF EXISTS thread_posts_parent_thread_guard_tg ON thread_posts;
      """
    )

    create table(:product_reviews) do
      add :entropy_id, :uuid, null: false, default: fragment("uuidv7()")
      add :product_id, references(:products, type: :bigint, on_delete: :delete_all), null: false
      add :user_id, references(:users, type: :bigint, on_delete: :nilify_all)
      add :rating, :integer, null: false
      add :title, :text
      add :body_md, :text
      add :verified_purchase, :boolean, null: false, default: false

      add :merchant_product_id,
          references(:merchant_products, type: :bigint, on_delete: :nilify_all)

      timestamps(type: :utc_datetime_usec)
    end

    create index(:product_reviews, [:product_id], name: :product_reviews_product_idx)

    create unique_index(:product_reviews, [:product_id, :user_id],
             name: :product_reviews_product_user_uq
           )

    create unique_index(:product_reviews, [:entropy_id])

    create constraint(:product_reviews, :product_reviews_rating_range,
             check: "rating BETWEEN 1 AND 5"
           )
  end
end

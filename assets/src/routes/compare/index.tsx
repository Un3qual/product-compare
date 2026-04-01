import { useRef, useState } from "react";
import { useLoaderData } from "react-router-dom";
import type { CompareRouteLoaderData } from "./api";
import { compareLoader, createSavedComparisonSet } from "./api";
import { CompareShell } from "./compare-shell";

export function CompareRoute() {
  const loaderData = useLoaderData<typeof compareLoader>() as CompareRouteLoaderData;
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const isSaveInFlightRef = useRef(false);

  async function handleSave() {
    if (loaderData.status !== "ready") {
      return;
    }

    if (isSaveInFlightRef.current) {
      return;
    }

    isSaveInFlightRef.current = true;
    setIsSaving(true);
    setSaveMessage(null);
    setSaveError(null);

    try {
      const result = await createSavedComparisonSet({
        name: buildSavedComparisonName(loaderData.products),
        productIds: loaderData.products.map((product) => product.id)
      });

      if (result.savedComparisonSetId) {
        setSaveMessage("Comparison saved.");
        return;
      }

      setSaveError(result.errors[0]?.message ?? "Request failed. Please try again.");
    } catch {
      setSaveError("Request failed. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }

  if (loaderData.status === "ready") {
    return (
      <CompareShell
        actions={
          <button disabled={isSaving} onClick={() => void handleSave()} type="button">
            {isSaving ? "Saving comparison..." : "Save comparison"}
          </button>
        }
        title="Compare products"
      >
        <p aria-live="polite" role="status">
          {saveMessage ?? ""}
        </p>
        {saveError ? <p role="alert">{saveError}</p> : null}
        <ul>
          {loaderData.products.map((product) => (
            <li key={product.id}>
              <article>
                <h2>{product.name}</h2>
                <p>{product.brandName ?? "Unknown brand"}</p>
                <p>{product.slug}</p>
                {product.description ? <p>{product.description}</p> : null}
              </article>
            </li>
          ))}
        </ul>
      </CompareShell>
    );
  }

  return (
    <CompareShell title="Compare products">
      {loaderData.status === "empty" ? <p>Choose up to 3 products to compare.</p> : null}
      {loaderData.status === "too_many" ? <p>You can compare up to 3 products.</p> : null}
      {loaderData.status === "not_found" ? (
        <p>One or more selected products were not found.</p>
      ) : null}
    </CompareShell>
  );
}

function buildSavedComparisonName(
  products: Array<{
    name: string;
  }>
) {
  const productNames = products
    .map((product) => product.name.trim())
    .filter((name) => name !== "");

  if (productNames.length === 0) {
    return "Saved comparison";
  }

  if (productNames.length === 1) {
    return `${productNames[0]} comparison`;
  }

  return productNames.join(" vs ");
}

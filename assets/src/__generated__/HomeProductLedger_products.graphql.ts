/**
 * @generated SignedSource<<66cb91162c02ee6740a33813ccd28e49>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ReaderFragment } from "relay-runtime";
export type HomePriceSignalCode =
  | "AT_OR_ABOVE_30_DAY_MEDIAN"
  | "BELOW_30_DAY_MEDIAN"
  | "NO_30_DAY_BASELINE"
  | "%future added value";
import { FragmentRefs } from "relay-runtime";
export type HomeProductLedger_products$data = {
  readonly edges: ReadonlyArray<{
    readonly highlights: ReadonlyArray<{
      readonly label: string;
      readonly value: string;
    }>;
    readonly node: {
      readonly id: string;
      readonly name: string;
      readonly slug: string;
    };
    readonly offer: {
      readonly currency: string;
      readonly landedPrice: string;
      readonly merchantName: string;
      readonly observedAt: string;
      readonly priceSignal: HomePriceSignalCode;
    };
  }>;
  readonly " $fragmentType": "HomeProductLedger_products";
};
export type HomeProductLedger_products$key = {
  readonly " $data"?: HomeProductLedger_products$data;
  readonly " $fragmentSpreads": FragmentRefs<"HomeProductLedger_products">;
};

const node: ReaderFragment = {
  argumentDefinitions: [],
  kind: "Fragment",
  metadata: null,
  name: "HomeProductLedger_products",
  selections: [
    {
      alias: null,
      args: null,
      concreteType: "HomeWorkspaceProductsEdge",
      kind: "LinkedField",
      name: "edges",
      plural: true,
      selections: [
        {
          alias: null,
          args: null,
          concreteType: "Product",
          kind: "LinkedField",
          name: "node",
          plural: false,
          selections: [
            {
              alias: null,
              args: null,
              kind: "ScalarField",
              name: "id",
              storageKey: null,
            },
            {
              alias: null,
              args: null,
              kind: "ScalarField",
              name: "name",
              storageKey: null,
            },
            {
              alias: null,
              args: null,
              kind: "ScalarField",
              name: "slug",
              storageKey: null,
            },
          ],
          storageKey: null,
        },
        {
          alias: null,
          args: null,
          concreteType: "HomeSpecificationHighlight",
          kind: "LinkedField",
          name: "highlights",
          plural: true,
          selections: [
            {
              alias: null,
              args: null,
              kind: "ScalarField",
              name: "label",
              storageKey: null,
            },
            {
              alias: null,
              args: null,
              kind: "ScalarField",
              name: "value",
              storageKey: null,
            },
          ],
          storageKey: null,
        },
        {
          alias: null,
          args: null,
          concreteType: "HomeOfferSummary",
          kind: "LinkedField",
          name: "offer",
          plural: false,
          selections: [
            {
              alias: null,
              args: null,
              kind: "ScalarField",
              name: "merchantName",
              storageKey: null,
            },
            {
              alias: null,
              args: null,
              kind: "ScalarField",
              name: "currency",
              storageKey: null,
            },
            {
              alias: null,
              args: null,
              kind: "ScalarField",
              name: "landedPrice",
              storageKey: null,
            },
            {
              alias: null,
              args: null,
              kind: "ScalarField",
              name: "priceSignal",
              storageKey: null,
            },
            {
              alias: null,
              args: null,
              kind: "ScalarField",
              name: "observedAt",
              storageKey: null,
            },
          ],
          storageKey: null,
        },
      ],
      storageKey: null,
    },
  ],
  type: "HomeWorkspaceProductsConnection",
  abstractKey: null,
};

(node as any).hash = "aacfb3c9a857233e5fe99dd4eedd0a9c";

export default node;

/**
 * @generated SignedSource<<1a97a26a1611356c2cb99a4727f2498e>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ReaderFragment } from "relay-runtime";
export type PriceWatchRuleType =
  | "BACK_IN_STOCK"
  | "NEWLY_AVAILABLE"
  | "PERCENTAGE_DROP"
  | "TARGET_PRICE"
  | "%future added value";
import { FragmentRefs } from "relay-runtime";
export type AlertsRoute_watch$data = {
  readonly baselineLandedPrice: string | null | undefined;
  readonly currency: string;
  readonly enabled: boolean;
  readonly id: string;
  readonly merchantName: string | null | undefined;
  readonly percentageDrop: string | null | undefined;
  readonly productName: string;
  readonly productSlug: string;
  readonly ruleType: PriceWatchRuleType;
  readonly targetAmount: string | null | undefined;
  readonly " $fragmentType": "AlertsRoute_watch";
};
export type AlertsRoute_watch$key = {
  readonly " $data"?: AlertsRoute_watch$data;
  readonly " $fragmentSpreads": FragmentRefs<"AlertsRoute_watch">;
};

const node: ReaderFragment = {
  argumentDefinitions: [],
  kind: "Fragment",
  metadata: null,
  name: "AlertsRoute_watch",
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
      name: "productName",
      storageKey: null,
    },
    {
      alias: null,
      args: null,
      kind: "ScalarField",
      name: "productSlug",
      storageKey: null,
    },
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
      name: "ruleType",
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
      name: "targetAmount",
      storageKey: null,
    },
    {
      alias: null,
      args: null,
      kind: "ScalarField",
      name: "percentageDrop",
      storageKey: null,
    },
    {
      alias: null,
      args: null,
      kind: "ScalarField",
      name: "baselineLandedPrice",
      storageKey: null,
    },
    {
      alias: null,
      args: null,
      kind: "ScalarField",
      name: "enabled",
      storageKey: null,
    },
  ],
  type: "PriceWatch",
  abstractKey: null,
};

(node as any).hash = "f9ab99b743f3a1ec111663fac562d015";

export default node;

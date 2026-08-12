/**
 * @generated SignedSource<<79a2215f59d222d814a6a9ebf5ed35b7>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ReaderFragment } from 'relay-runtime';
export type PriceWatchRuleType = "BACK_IN_STOCK" | "NEWLY_AVAILABLE" | "PERCENTAGE_DROP" | "TARGET_PRICE" | "%future added value";
import { FragmentRefs } from "relay-runtime";
export type AlertsRoute_alert$data = {
  readonly currency: string;
  readonly id: string;
  readonly landedPrice: any;
  readonly merchantName: string;
  readonly observedAt: any;
  readonly productName: string;
  readonly productSlug: string;
  readonly readAt: any | null | undefined;
  readonly ruleType: PriceWatchRuleType;
  readonly " $fragmentType": "AlertsRoute_alert";
};
export type AlertsRoute_alert$key = {
  readonly " $data"?: AlertsRoute_alert$data;
  readonly " $fragmentSpreads": FragmentRefs<"AlertsRoute_alert">;
};

const node: ReaderFragment = {
  "argumentDefinitions": [],
  "kind": "Fragment",
  "metadata": null,
  "name": "AlertsRoute_alert",
  "selections": [
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "id",
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "productName",
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "productSlug",
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "merchantName",
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "ruleType",
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "currency",
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "landedPrice",
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "observedAt",
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "readAt",
      "storageKey": null
    }
  ],
  "type": "AlertEvent",
  "abstractKey": null
};

(node as any).hash = "09b0c4e729304ca7c1ebf7787724d7ea";

export default node;

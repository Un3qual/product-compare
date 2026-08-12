/**
 * @generated SignedSource<<8f9c2606403b6c41cf3a116f61c3f73c>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ReaderFragment } from 'relay-runtime';
export type HomeDealReasonCode = "CURRENT_COMPARISON" | "NEW_OFFER" | "SAVED_COMPARISON" | "TRENDING_BELOW_MEDIAN" | "WATCH_TARGET" | "%future added value";
import { FragmentRefs } from "relay-runtime";
export type HomeDeals_deal$data = {
  readonly node: {
    readonly id: string;
    readonly name: string;
    readonly slug: string;
  };
  readonly offer: {
    readonly currency: string;
    readonly landedPrice: any;
    readonly merchantName: string;
    readonly observedAt: any;
  };
  readonly reasons: ReadonlyArray<{
    readonly code: HomeDealReasonCode;
    readonly watchTarget: any | null | undefined;
  }>;
  readonly " $fragmentType": "HomeDeals_deal";
};
export type HomeDeals_deal$key = {
  readonly " $data"?: HomeDeals_deal$data;
  readonly " $fragmentSpreads": FragmentRefs<"HomeDeals_deal">;
};

const node: ReaderFragment = {
  "argumentDefinitions": [],
  "kind": "Fragment",
  "metadata": null,
  "name": "HomeDeals_deal",
  "selections": [
    {
      "alias": null,
      "args": null,
      "concreteType": "Product",
      "kind": "LinkedField",
      "name": "node",
      "plural": false,
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
          "name": "name",
          "storageKey": null
        },
        {
          "alias": null,
          "args": null,
          "kind": "ScalarField",
          "name": "slug",
          "storageKey": null
        }
      ],
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "concreteType": "HomeOfferSummary",
      "kind": "LinkedField",
      "name": "offer",
      "plural": false,
      "selections": [
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
        }
      ],
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "concreteType": "HomeDealReason",
      "kind": "LinkedField",
      "name": "reasons",
      "plural": true,
      "selections": [
        {
          "alias": null,
          "args": null,
          "kind": "ScalarField",
          "name": "code",
          "storageKey": null
        },
        {
          "alias": null,
          "args": null,
          "kind": "ScalarField",
          "name": "watchTarget",
          "storageKey": null
        }
      ],
      "storageKey": null
    }
  ],
  "type": "HomeDealsEdge",
  "abstractKey": null
};

(node as any).hash = "934316257fcbb56d8e0683c5e231e39d";

export default node;

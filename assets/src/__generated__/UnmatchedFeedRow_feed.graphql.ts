/**
 * @generated SignedSource<<059282db970dcea6b90b6838307567ff>>
 * @lightSyntaxTransform
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ReaderFragment } from 'relay-runtime';
import { FragmentRefs } from "relay-runtime";
export type UnmatchedFeedRow_feed$data = {
  readonly advertiserCountry: string | null;
  readonly advertiserName: string | null;
  readonly currency: string | null;
  readonly feedName: string | null;
  readonly language: string | null;
  readonly lastSeenAt: string;
  readonly productCount: number | null;
  readonly providerFeedId: string;
  readonly sourceFeedType: string | null;
  readonly " $fragmentType": "UnmatchedFeedRow_feed";
};
export type UnmatchedFeedRow_feed$key = {
  readonly " $data"?: UnmatchedFeedRow_feed$data;
  readonly " $fragmentSpreads": FragmentRefs<"UnmatchedFeedRow_feed">;
};

const node: ReaderFragment = {
  "argumentDefinitions": [],
  "kind": "Fragment",
  "metadata": null,
  "name": "UnmatchedFeedRow_feed",
  "selections": [
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "providerFeedId",
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "advertiserName",
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "advertiserCountry",
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "sourceFeedType",
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
      "name": "language",
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "feedName",
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "productCount",
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "lastSeenAt",
      "storageKey": null
    }
  ],
  "type": "MerchantFeedCandidate",
  "abstractKey": null
};

(node as any).hash = "9be64bbe0c2584bc2dd2322a0d45b7ee";

export default node;

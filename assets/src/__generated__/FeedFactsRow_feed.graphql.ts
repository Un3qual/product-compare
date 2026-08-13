/**
 * @generated SignedSource<<16aa15119130239d5e5239f473bf268d>>
 * @lightSyntaxTransform
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ReaderFragment } from 'relay-runtime';
import { FragmentRefs } from "relay-runtime";
export type FeedFactsRow_feed$data = {
  readonly advertiserCountry: string | null;
  readonly advertiserName: string | null;
  readonly currency: string | null;
  readonly feedName: string | null;
  readonly id: string;
  readonly language: string | null;
  readonly lastSeenAt: string;
  readonly productCount: number | null;
  readonly providerFeedId: string;
  readonly sourceFeedType: string | null;
  readonly " $fragmentType": "FeedFactsRow_feed";
};
export type FeedFactsRow_feed$key = {
  readonly " $data"?: FeedFactsRow_feed$data;
  readonly " $fragmentSpreads": FragmentRefs<"FeedFactsRow_feed">;
};

const node: ReaderFragment = {
  "argumentDefinitions": [],
  "kind": "Fragment",
  "metadata": null,
  "name": "FeedFactsRow_feed",
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

(node as any).hash = "eebb183280ce2f8b44f2e4397089da11";

export default node;

/**
 * @generated SignedSource<<a28e481d15a525f56fac22bab5fd5bed>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ReaderFragment } from 'relay-runtime';
import { FragmentRefs } from "relay-runtime";
export type CJFeedRow_feed$data = {
  readonly advertiserCountry: string | null | undefined;
  readonly advertiserName: string | null | undefined;
  readonly currency: string | null | undefined;
  readonly feedName: string | null | undefined;
  readonly id: string;
  readonly language: string | null | undefined;
  readonly lastSeenAt: string;
  readonly productCount: number | null | undefined;
  readonly providerFeedId: string;
  readonly sourceFeedType: string | null | undefined;
  readonly " $fragmentType": "CJFeedRow_feed";
};
export type CJFeedRow_feed$key = {
  readonly " $data"?: CJFeedRow_feed$data;
  readonly " $fragmentSpreads": FragmentRefs<"CJFeedRow_feed">;
};

const node: ReaderFragment = {
  "argumentDefinitions": [],
  "kind": "Fragment",
  "metadata": null,
  "name": "CJFeedRow_feed",
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

(node as any).hash = "52c88eab449fc224591413f44e9cef3b";

export default node;

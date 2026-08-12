/**
 * @generated SignedSource<<4c3bedf863a92ca3b17cd7fd2cbeb379>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ReaderFragment } from 'relay-runtime';
export type CommunityModerationStatus = "HIDDEN" | "PENDING" | "PUBLISHED" | "REJECTED" | "REMOVED" | "%future added value";
import { FragmentRefs } from "relay-runtime";
export type ProductCommunityItems_review$data = {
  readonly authorLabel: string;
  readonly body: string | null | undefined;
  readonly id: string;
  readonly moderationStatus: CommunityModerationStatus;
  readonly rating: number;
  readonly title: string | null | undefined;
  readonly verifiedPurchase: boolean;
  readonly viewerCanEdit: boolean;
  readonly viewerCanRemove: boolean;
  readonly " $fragmentType": "ProductCommunityItems_review";
};
export type ProductCommunityItems_review$key = {
  readonly " $data"?: ProductCommunityItems_review$data;
  readonly " $fragmentSpreads": FragmentRefs<"ProductCommunityItems_review">;
};

const node: ReaderFragment = {
  "argumentDefinitions": [],
  "kind": "Fragment",
  "metadata": null,
  "name": "ProductCommunityItems_review",
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
      "name": "rating",
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "title",
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "body",
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "verifiedPurchase",
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "authorLabel",
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "moderationStatus",
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "viewerCanEdit",
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "viewerCanRemove",
      "storageKey": null
    }
  ],
  "type": "ProductReview",
  "abstractKey": null
};

(node as any).hash = "ff947c5349c374c63451dac90eb82359";

export default node;

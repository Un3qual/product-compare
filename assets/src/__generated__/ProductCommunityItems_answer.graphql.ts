/**
 * @generated SignedSource<<4a9730baf01a98bea69dd76ef4154368>>
 * @lightSyntaxTransform
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ReaderFragment } from 'relay-runtime';
export type CommunityModerationStatus = "HIDDEN" | "PENDING" | "PUBLISHED" | "REJECTED" | "REMOVED" | "%future added value";
import { FragmentRefs } from "relay-runtime";
export type ProductCommunityItems_answer$data = {
  readonly authorLabel: string;
  readonly body: string;
  readonly id: string;
  readonly moderationStatus: CommunityModerationStatus;
  readonly viewerCanEdit: boolean;
  readonly viewerCanRemove: boolean;
  readonly " $fragmentType": "ProductCommunityItems_answer";
};
export type ProductCommunityItems_answer$key = {
  readonly " $data"?: ProductCommunityItems_answer$data;
  readonly " $fragmentSpreads": FragmentRefs<"ProductCommunityItems_answer">;
};

const node: ReaderFragment = {
  "argumentDefinitions": [],
  "kind": "Fragment",
  "metadata": null,
  "name": "ProductCommunityItems_answer",
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
      "name": "body",
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
  "type": "ProductAnswer",
  "abstractKey": null
};

(node as any).hash = "e5d167e4df00d02b169b956903888e9b";

export default node;

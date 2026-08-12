/**
 * @generated SignedSource<<97870ac8590f7281502365e780f9d4bb>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ReaderFragment } from 'relay-runtime';
export type CommunityModerationStatus = "HIDDEN" | "PENDING" | "PUBLISHED" | "REJECTED" | "REMOVED" | "%future added value";
import { FragmentRefs } from "relay-runtime";
export type ProductCommunityItems_question$data = {
  readonly authorLabel: string;
  readonly body: string | null | undefined;
  readonly id: string;
  readonly moderationStatus: CommunityModerationStatus;
  readonly title: string;
  readonly viewerCanEdit: boolean;
  readonly viewerCanRemove: boolean;
  readonly " $fragmentType": "ProductCommunityItems_question";
};
export type ProductCommunityItems_question$key = {
  readonly " $data"?: ProductCommunityItems_question$data;
  readonly " $fragmentSpreads": FragmentRefs<"ProductCommunityItems_question">;
};

const node: ReaderFragment = {
  "argumentDefinitions": [],
  "kind": "Fragment",
  "metadata": null,
  "name": "ProductCommunityItems_question",
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
  "type": "ProductQuestion",
  "abstractKey": null
};

(node as any).hash = "1bd299b2736742ccd01d92b4f1f364f4";

export default node;

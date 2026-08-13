/**
 * @generated SignedSource<<8a9b4c734cd22917a6a531a094579613>>
 * @lightSyntaxTransform
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ReaderFragment } from 'relay-runtime';
import { FragmentRefs } from "relay-runtime";
export type ApiTokenItem_token$data = {
  readonly expiresAt: string | null;
  readonly id: string;
  readonly insertedAt: string;
  readonly label: string | null;
  readonly lastUsedAt: string | null;
  readonly revokedAt: string | null;
  readonly tokenPrefix: string;
  readonly " $fragmentType": "ApiTokenItem_token";
};
export type ApiTokenItem_token$key = {
  readonly " $data"?: ApiTokenItem_token$data;
  readonly " $fragmentSpreads": FragmentRefs<"ApiTokenItem_token">;
};

const node: ReaderFragment = {
  "argumentDefinitions": [],
  "kind": "Fragment",
  "metadata": null,
  "name": "ApiTokenItem_token",
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
      "name": "label",
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "tokenPrefix",
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "lastUsedAt",
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "expiresAt",
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "revokedAt",
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "insertedAt",
      "storageKey": null
    }
  ],
  "type": "ApiToken",
  "abstractKey": null
};

(node as any).hash = "de66582383f51e872664ec0060e714a3";

export default node;

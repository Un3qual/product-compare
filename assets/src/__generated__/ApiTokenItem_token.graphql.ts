/**
 * @generated SignedSource<<2023fd749808ad6558bc69d28e946ad5>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ReaderFragment } from 'relay-runtime';
import { FragmentRefs } from "relay-runtime";
export type ApiTokenItem_token$data = {
  readonly expiresAt: any | null | undefined;
  readonly id: string;
  readonly insertedAt: any;
  readonly label: string | null | undefined;
  readonly lastUsedAt: any | null | undefined;
  readonly revokedAt: any | null | undefined;
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

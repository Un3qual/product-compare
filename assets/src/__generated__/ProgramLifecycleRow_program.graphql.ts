/**
 * @generated SignedSource<<b2bc7369ce3ce235f6a8b34396683602>>
 * @lightSyntaxTransform
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ReaderFragment } from 'relay-runtime';
export type CJProgramStage = "ACCEPTED" | "APPLIED" | "CONSIDERING" | "DECLINED" | "NEW" | "NOT_PURSUING" | "SELECTED" | "%future added value";
export type CJProgramWarningCode = "MISSING_ADVERTISER_NAME" | "MISSING_PRODUCT_COUNT" | "NON_ENGLISH_LANGUAGE" | "NON_USD_CURRENCY" | "NON_US_MARKET" | "%future added value";
import { FragmentRefs } from "relay-runtime";
export type ProgramLifecycleRow_program$data = {
  readonly advertiserId: string;
  readonly advertiserName: string | null;
  readonly feedCount: number | null;
  readonly id: string;
  readonly lastChanged: string;
  readonly note: string | null;
  readonly stage: CJProgramStage;
  readonly warningCodes: ReadonlyArray<CJProgramWarningCode>;
  readonly " $fragmentType": "ProgramLifecycleRow_program";
};
export type ProgramLifecycleRow_program$key = {
  readonly " $data"?: ProgramLifecycleRow_program$data;
  readonly " $fragmentSpreads": FragmentRefs<"ProgramLifecycleRow_program">;
};

const node: ReaderFragment = {
  "argumentDefinitions": [],
  "kind": "Fragment",
  "metadata": null,
  "name": "ProgramLifecycleRow_program",
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
      "name": "advertiserId",
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
      "name": "stage",
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "note",
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "lastChanged",
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "feedCount",
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "warningCodes",
      "storageKey": null
    }
  ],
  "type": "CJProgram",
  "abstractKey": null
};

(node as any).hash = "d25b97d95e681814ad717ca896b12092";

export default node;

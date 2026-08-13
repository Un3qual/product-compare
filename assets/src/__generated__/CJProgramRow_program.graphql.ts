/**
 * @generated SignedSource<<c5c6c5d02b7e8eafcfe4371cddf5abb3>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ReaderFragment } from "relay-runtime";
export type CJProgramStage =
  | "ACCEPTED"
  | "APPLIED"
  | "CONSIDERING"
  | "DECLINED"
  | "NEW"
  | "NOT_PURSUING"
  | "SELECTED"
  | "%future added value";
export type CJProgramWarningCode =
  | "MISSING_ADVERTISER_NAME"
  | "MISSING_PRODUCT_COUNT"
  | "NON_ENGLISH_LANGUAGE"
  | "NON_USD_CURRENCY"
  | "NON_US_MARKET"
  | "%future added value";
import { FragmentRefs } from "relay-runtime";
export type CJProgramRow_program$data = {
  readonly advertiserId: string;
  readonly advertiserName: string | null | undefined;
  readonly feedCount: number | null | undefined;
  readonly id: string;
  readonly lastChanged: string;
  readonly note: string | null | undefined;
  readonly stage: CJProgramStage;
  readonly warningCodes: ReadonlyArray<CJProgramWarningCode>;
  readonly " $fragmentType": "CJProgramRow_program";
};
export type CJProgramRow_program$key = {
  readonly " $data"?: CJProgramRow_program$data;
  readonly " $fragmentSpreads": FragmentRefs<"CJProgramRow_program">;
};

const node: ReaderFragment = {
  argumentDefinitions: [],
  kind: "Fragment",
  metadata: null,
  name: "CJProgramRow_program",
  selections: [
    {
      alias: null,
      args: null,
      kind: "ScalarField",
      name: "id",
      storageKey: null,
    },
    {
      alias: null,
      args: null,
      kind: "ScalarField",
      name: "advertiserId",
      storageKey: null,
    },
    {
      alias: null,
      args: null,
      kind: "ScalarField",
      name: "advertiserName",
      storageKey: null,
    },
    {
      alias: null,
      args: null,
      kind: "ScalarField",
      name: "stage",
      storageKey: null,
    },
    {
      alias: null,
      args: null,
      kind: "ScalarField",
      name: "note",
      storageKey: null,
    },
    {
      alias: null,
      args: null,
      kind: "ScalarField",
      name: "lastChanged",
      storageKey: null,
    },
    {
      alias: null,
      args: null,
      kind: "ScalarField",
      name: "feedCount",
      storageKey: null,
    },
    {
      alias: null,
      args: null,
      kind: "ScalarField",
      name: "warningCodes",
      storageKey: null,
    },
  ],
  type: "CJProgram",
  abstractKey: null,
};

(node as any).hash = "6ef1b97ec06b828e768df319f36a5d57";

export default node;

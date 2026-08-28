/**
 * @generated SignedSource<<128aa9e4bf5972957078cf27f94741cb>>
 * @lightSyntaxTransform
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ReaderFragment } from 'relay-runtime';
import { FragmentRefs } from "relay-runtime";
export type ConversionIngestionSettings_ingestion$data = {
  readonly credentials: {
    readonly ready: boolean;
  };
  readonly latestSuccess: {
    readonly id: string;
  } | null;
  readonly settings: {
    readonly enabled: boolean;
    readonly intervalMinutes: number;
    readonly lookbackDays: number;
    readonly maxPages: number;
    readonly updatedAt: string;
  };
  readonly " $fragmentType": "ConversionIngestionSettings_ingestion";
};
export type ConversionIngestionSettings_ingestion$key = {
  readonly " $data"?: ConversionIngestionSettings_ingestion$data;
  readonly " $fragmentSpreads": FragmentRefs<"ConversionIngestionSettings_ingestion">;
};

const node: ReaderFragment = {
  "argumentDefinitions": [],
  "kind": "Fragment",
  "metadata": null,
  "name": "ConversionIngestionSettings_ingestion",
  "selections": [
    {
      "alias": null,
      "args": null,
      "concreteType": "CJCommissionIngestionSettings",
      "kind": "LinkedField",
      "name": "settings",
      "plural": false,
      "selections": [
        {
          "alias": null,
          "args": null,
          "kind": "ScalarField",
          "name": "enabled",
          "storageKey": null
        },
        {
          "alias": null,
          "args": null,
          "kind": "ScalarField",
          "name": "intervalMinutes",
          "storageKey": null
        },
        {
          "alias": null,
          "args": null,
          "kind": "ScalarField",
          "name": "lookbackDays",
          "storageKey": null
        },
        {
          "alias": null,
          "args": null,
          "kind": "ScalarField",
          "name": "maxPages",
          "storageKey": null
        },
        {
          "alias": null,
          "args": null,
          "kind": "ScalarField",
          "name": "updatedAt",
          "storageKey": null
        }
      ],
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "concreteType": "CJCommissionCredentialStatus",
      "kind": "LinkedField",
      "name": "credentials",
      "plural": false,
      "selections": [
        {
          "alias": null,
          "args": null,
          "kind": "ScalarField",
          "name": "ready",
          "storageKey": null
        }
      ],
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "concreteType": "CJCommissionSyncRun",
      "kind": "LinkedField",
      "name": "latestSuccess",
      "plural": false,
      "selections": [
        {
          "alias": null,
          "args": null,
          "kind": "ScalarField",
          "name": "id",
          "storageKey": null
        }
      ],
      "storageKey": null
    }
  ],
  "type": "CJCommissionIngestion",
  "abstractKey": null
};

(node as any).hash = "2b554b33dd9391b0cee23baf46623a78";

export default node;

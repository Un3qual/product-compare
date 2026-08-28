/**
 * @generated SignedSource<<58cdfb895792de8b8b5d880815cfd5e0>>
 * @lightSyntaxTransform
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
import { FragmentRefs } from "relay-runtime";
export type ConversionIngestionStatusRefetchQuery$variables = Record<PropertyKey, never>;
export type ConversionIngestionStatusRefetchQuery$data = {
  readonly " $fragmentSpreads": FragmentRefs<"ConversionIngestionStatus_query">;
};
export type ConversionIngestionStatusRefetchQuery = {
  response: ConversionIngestionStatusRefetchQuery$data;
  variables: ConversionIngestionStatusRefetchQuery$variables;
};

const node: ConcreteRequest = (function(){
var v0 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "id",
  "storageKey": null
},
v1 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "finishedAt",
  "storageKey": null
};
return {
  "fragment": {
    "argumentDefinitions": [],
    "kind": "Fragment",
    "metadata": null,
    "name": "ConversionIngestionStatusRefetchQuery",
    "selections": [
      {
        "args": null,
        "kind": "FragmentSpread",
        "name": "ConversionIngestionStatus_query"
      }
    ],
    "type": "RootQueryType",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": [],
    "kind": "Operation",
    "name": "ConversionIngestionStatusRefetchQuery",
    "selections": [
      {
        "alias": null,
        "args": null,
        "concreteType": "CJCommissionIngestion",
        "kind": "LinkedField",
        "name": "cjCommissionIngestion",
        "plural": false,
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
              },
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "nextRunAt",
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
              },
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "apiTokenConfigured",
                "storageKey": null
              },
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "accountIdConfigured",
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
              (v0/*:: as any*/),
              (v1/*:: as any*/)
            ],
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "concreteType": "CJCommissionIngestionActivity",
            "kind": "LinkedField",
            "name": "activity",
            "plural": false,
            "selections": [
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "state",
                "storageKey": null
              },
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "windowStart",
                "storageKey": null
              },
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "windowEnd",
                "storageKey": null
              },
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "scheduledAt",
                "storageKey": null
              },
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "attemptedAt",
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
            "name": "latestFailure",
            "plural": false,
            "selections": [
              (v1/*:: as any*/),
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "errorSummary",
                "storageKey": null
              },
              (v0/*:: as any*/)
            ],
            "storageKey": null
          }
        ],
        "storageKey": null
      }
    ]
  },
  "params": {
    "cacheID": "f19c8de705a24cc3f21a4933c92c5ffb",
    "id": null,
    "metadata": {},
    "name": "ConversionIngestionStatusRefetchQuery",
    "operationKind": "query",
    "text": "query ConversionIngestionStatusRefetchQuery {\n  ...ConversionIngestionStatus_query\n}\n\nfragment ConversionIngestionSettings_ingestion on CJCommissionIngestion {\n  settings {\n    enabled\n    intervalMinutes\n    lookbackDays\n    maxPages\n    updatedAt\n  }\n  credentials {\n    ready\n  }\n  latestSuccess {\n    id\n  }\n}\n\nfragment ConversionIngestionStatus_query on RootQueryType {\n  cjCommissionIngestion {\n    ...ConversionIngestionSettings_ingestion\n    settings {\n      nextRunAt\n    }\n    credentials {\n      apiTokenConfigured\n      accountIdConfigured\n      ready\n    }\n    activity {\n      state\n      windowStart\n      windowEnd\n      scheduledAt\n      attemptedAt\n    }\n    latestSuccess {\n      finishedAt\n      id\n    }\n    latestFailure {\n      finishedAt\n      errorSummary\n      id\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "1c697ecd6d3289e86856770e84e5db6b";

export default node;

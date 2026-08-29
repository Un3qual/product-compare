/**
 * @generated SignedSource<<e5d88e4ed2a5d80e6a99c5f925d52892>>
 * @lightSyntaxTransform
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
import { FragmentRefs } from "relay-runtime";
export type ConversionIngestionRouteQuery$variables = Record<PropertyKey, never>;
export type ConversionIngestionRouteQuery$data = {
  readonly " $fragmentSpreads": FragmentRefs<"ConversionIngestionStatus_query">;
};
export type ConversionIngestionRouteQuery = {
  response: ConversionIngestionRouteQuery$data;
  variables: ConversionIngestionRouteQuery$variables;
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
    "name": "ConversionIngestionRouteQuery",
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
    "name": "ConversionIngestionRouteQuery",
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
                "name": "publisherIdsConfigured",
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
    "cacheID": "a2b1c41ed533830d96eeec58a2e2bb71",
    "id": null,
    "metadata": {},
    "name": "ConversionIngestionRouteQuery",
    "operationKind": "query",
    "text": "query ConversionIngestionRouteQuery {\n  ...ConversionIngestionStatus_query\n}\n\nfragment ConversionIngestionSettings_ingestion on CJCommissionIngestion {\n  settings {\n    enabled\n    intervalMinutes\n    lookbackDays\n    maxPages\n    updatedAt\n  }\n  credentials {\n    ready\n  }\n  latestSuccess {\n    id\n  }\n}\n\nfragment ConversionIngestionStatus_query on RootQueryType {\n  cjCommissionIngestion {\n    ...ConversionIngestionSettings_ingestion\n    settings {\n      nextRunAt\n    }\n    credentials {\n      apiTokenConfigured\n      publisherIdsConfigured\n      ready\n    }\n    activity {\n      state\n      windowStart\n      windowEnd\n      scheduledAt\n      attemptedAt\n    }\n    latestSuccess {\n      finishedAt\n      id\n    }\n    latestFailure {\n      finishedAt\n      errorSummary\n      id\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "535fc9ec80d0f89d265b953949b1b8fb";

export default node;

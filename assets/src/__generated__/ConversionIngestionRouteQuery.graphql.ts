/**
 * @generated SignedSource<<43fe66d5d1dd678f79bada6627e1a872>>
 * @lightSyntaxTransform
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
import { FragmentRefs } from "relay-runtime";
export type ConversionIngestionRouteQuery$variables = Record<PropertyKey, never>;
export type ConversionIngestionRouteQuery$data = {
  readonly cjCommissionIngestion: {
    readonly " $fragmentSpreads": FragmentRefs<"ConversionIngestionSettings_ingestion">;
  };
  readonly " $fragmentSpreads": FragmentRefs<"ConversionIngestionStatus_query">;
};
export type ConversionIngestionRouteQuery = {
  response: ConversionIngestionRouteQuery$data;
  variables: ConversionIngestionRouteQuery$variables;
};

const node: ConcreteRequest = (function(){
var v0 = [
  {
    "alias": null,
    "args": null,
    "kind": "ScalarField",
    "name": "finishedAt",
    "storageKey": null
  },
  {
    "alias": null,
    "args": null,
    "kind": "ScalarField",
    "name": "id",
    "storageKey": null
  }
];
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
      },
      {
        "alias": null,
        "args": null,
        "concreteType": "CJCommissionIngestion",
        "kind": "LinkedField",
        "name": "cjCommissionIngestion",
        "plural": false,
        "selections": [
          {
            "args": null,
            "kind": "FragmentSpread",
            "name": "ConversionIngestionSettings_ingestion"
          }
        ],
        "storageKey": null
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
                "name": "nextRunAt",
                "storageKey": null
              },
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
                "name": "apiTokenConfigured",
                "storageKey": null
              },
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "accountIdConfigured",
                "storageKey": null
              },
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
            "name": "latestSuccess",
            "plural": false,
            "selections": (v0/*:: as any*/),
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "concreteType": "CJCommissionSyncRun",
            "kind": "LinkedField",
            "name": "latestFailure",
            "plural": false,
            "selections": (v0/*:: as any*/),
            "storageKey": null
          }
        ],
        "storageKey": null
      }
    ]
  },
  "params": {
    "cacheID": "f762bc2d73d82c1759c5e2595f3e51c5",
    "id": null,
    "metadata": {},
    "name": "ConversionIngestionRouteQuery",
    "operationKind": "query",
    "text": "query ConversionIngestionRouteQuery {\n  ...ConversionIngestionStatus_query\n  cjCommissionIngestion {\n    ...ConversionIngestionSettings_ingestion\n  }\n}\n\nfragment ConversionIngestionSettings_ingestion on CJCommissionIngestion {\n  settings {\n    enabled\n    intervalMinutes\n    lookbackDays\n    maxPages\n    updatedAt\n  }\n  credentials {\n    ready\n  }\n}\n\nfragment ConversionIngestionStatus_query on RootQueryType {\n  cjCommissionIngestion {\n    settings {\n      nextRunAt\n    }\n    credentials {\n      apiTokenConfigured\n      accountIdConfigured\n      ready\n    }\n    activity {\n      state\n      scheduledAt\n      attemptedAt\n    }\n    latestSuccess {\n      finishedAt\n      id\n    }\n    latestFailure {\n      finishedAt\n      id\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "a603eaf5cc585177778d87f9a53ade8b";

export default node;

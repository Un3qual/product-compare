/**
 * @generated SignedSource<<552e50864537f844e35224ea51d9b772>>
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
  "name": "finishedAt",
  "storageKey": null
},
v1 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "id",
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
            "concreteType": "CJCommissionSyncRun",
            "kind": "LinkedField",
            "name": "latestFailure",
            "plural": false,
            "selections": [
              (v0/*:: as any*/),
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "errorSummary",
                "storageKey": null
              },
              (v1/*:: as any*/)
            ],
            "storageKey": null
          }
        ],
        "storageKey": null
      }
    ]
  },
  "params": {
    "cacheID": "d7407ac576b22b1584255eef58000964",
    "id": null,
    "metadata": {},
    "name": "ConversionIngestionStatusRefetchQuery",
    "operationKind": "query",
    "text": "query ConversionIngestionStatusRefetchQuery {\n  ...ConversionIngestionStatus_query\n}\n\nfragment ConversionIngestionStatus_query on RootQueryType {\n  cjCommissionIngestion {\n    settings {\n      nextRunAt\n    }\n    credentials {\n      apiTokenConfigured\n      accountIdConfigured\n      ready\n    }\n    activity {\n      state\n      windowStart\n      windowEnd\n      scheduledAt\n      attemptedAt\n    }\n    latestSuccess {\n      finishedAt\n      id\n    }\n    latestFailure {\n      finishedAt\n      errorSummary\n      id\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "e32228e1d72e777a7fa4b39267c74083";

export default node;

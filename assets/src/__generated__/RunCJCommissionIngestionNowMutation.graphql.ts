/**
 * @generated SignedSource<<1a4cb983b27c2ccd37a35f22b224aceb>>
 * @lightSyntaxTransform
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type CJCommissionIngestionActivityState = "AVAILABLE" | "EXECUTING" | "RETRYABLE" | "SCHEDULED" | "SUSPENDED" | "%future added value";
export type RunCJCommissionIngestionNowMutation$variables = Record<PropertyKey, never>;
export type RunCJCommissionIngestionNowMutation$data = {
  readonly runCjCommissionIngestionNow: {
    readonly errors: ReadonlyArray<{
      readonly code: string;
      readonly field: string | null;
      readonly message: string;
    }>;
    readonly ingestion: {
      readonly activity: {
        readonly state: CJCommissionIngestionActivityState;
      } | null;
    } | null;
  };
};
export type RunCJCommissionIngestionNowMutation = {
  response: RunCJCommissionIngestionNowMutation$data;
  variables: RunCJCommissionIngestionNowMutation$variables;
};

const node: ConcreteRequest = (function(){
var v0 = [
  {
    "alias": null,
    "args": null,
    "concreteType": "CJCommissionIngestionPayload",
    "kind": "LinkedField",
    "name": "runCjCommissionIngestionNow",
    "plural": false,
    "selections": [
      {
        "alias": null,
        "args": null,
        "concreteType": "CJCommissionIngestion",
        "kind": "LinkedField",
        "name": "ingestion",
        "plural": false,
        "selections": [
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
              }
            ],
            "storageKey": null
          }
        ],
        "storageKey": null
      },
      {
        "alias": null,
        "args": null,
        "concreteType": "MutationError",
        "kind": "LinkedField",
        "name": "errors",
        "plural": true,
        "selections": [
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "code",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "field",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "message",
            "storageKey": null
          }
        ],
        "storageKey": null
      }
    ],
    "storageKey": null
  }
];
return {
  "fragment": {
    "argumentDefinitions": [],
    "kind": "Fragment",
    "metadata": null,
    "name": "RunCJCommissionIngestionNowMutation",
    "selections": (v0/*:: as any*/),
    "type": "RootMutationType",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": [],
    "kind": "Operation",
    "name": "RunCJCommissionIngestionNowMutation",
    "selections": (v0/*:: as any*/)
  },
  "params": {
    "cacheID": "607f8e0c8965083bdbe9fda17a3a80c2",
    "id": null,
    "metadata": {},
    "name": "RunCJCommissionIngestionNowMutation",
    "operationKind": "mutation",
    "text": "mutation RunCJCommissionIngestionNowMutation {\n  runCjCommissionIngestionNow {\n    ingestion {\n      activity {\n        state\n      }\n    }\n    errors {\n      code\n      field\n      message\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "10bcf7e0112494b59b775584a8f2588a";

export default node;

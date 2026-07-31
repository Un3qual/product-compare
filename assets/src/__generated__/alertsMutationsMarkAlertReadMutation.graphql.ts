/**
 * @generated SignedSource<<f1f7d70a199a2a7a1ee0ba5d54813227>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type alertsMutationsMarkAlertReadMutation$variables = {
  id: string;
};
export type alertsMutationsMarkAlertReadMutation$data = {
  readonly markAlertRead: {
    readonly errors: ReadonlyArray<{
      readonly code: string;
      readonly field: string | null | undefined;
      readonly message: string;
    }>;
    readonly event: {
      readonly id: string;
      readonly readAt: any | null | undefined;
    } | null | undefined;
  };
};
export type alertsMutationsMarkAlertReadMutation = {
  response: alertsMutationsMarkAlertReadMutation$data;
  variables: alertsMutationsMarkAlertReadMutation$variables;
};

const node: ConcreteRequest = (function(){
var v0 = [
  {
    "defaultValue": null,
    "kind": "LocalArgument",
    "name": "id"
  }
],
v1 = [
  {
    "alias": null,
    "args": [
      {
        "kind": "Variable",
        "name": "id",
        "variableName": "id"
      }
    ],
    "concreteType": "AlertEventPayload",
    "kind": "LinkedField",
    "name": "markAlertRead",
    "plural": false,
    "selections": [
      {
        "alias": null,
        "args": null,
        "concreteType": "AlertEvent",
        "kind": "LinkedField",
        "name": "event",
        "plural": false,
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
            "name": "readAt",
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
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Fragment",
    "metadata": null,
    "name": "alertsMutationsMarkAlertReadMutation",
    "selections": (v1/*: any*/),
    "type": "RootMutationType",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "alertsMutationsMarkAlertReadMutation",
    "selections": (v1/*: any*/)
  },
  "params": {
    "cacheID": "30a43bce7f21f908da645fc29c55832c",
    "id": null,
    "metadata": {},
    "name": "alertsMutationsMarkAlertReadMutation",
    "operationKind": "mutation",
    "text": "mutation alertsMutationsMarkAlertReadMutation(\n  $id: ID!\n) {\n  markAlertRead(id: $id) {\n    event {\n      id\n      readAt\n    }\n    errors {\n      code\n      field\n      message\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "4c56a8c5f3c89d2dabfc399908bc89e9";

export default node;

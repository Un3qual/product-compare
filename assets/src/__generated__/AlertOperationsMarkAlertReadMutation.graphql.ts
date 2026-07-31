/**
 * @generated SignedSource<<8710d2eb0b53363304ba41994d8ebd50>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type AlertOperationsMarkAlertReadMutation$variables = {
  id: string;
};
export type AlertOperationsMarkAlertReadMutation$data = {
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
export type AlertOperationsMarkAlertReadMutation = {
  response: AlertOperationsMarkAlertReadMutation$data;
  variables: AlertOperationsMarkAlertReadMutation$variables;
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
    "name": "AlertOperationsMarkAlertReadMutation",
    "selections": (v1/*: any*/),
    "type": "RootMutationType",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "AlertOperationsMarkAlertReadMutation",
    "selections": (v1/*: any*/)
  },
  "params": {
    "cacheID": "48bf899b13001c9e21dc4e8fbf098a7b",
    "id": null,
    "metadata": {},
    "name": "AlertOperationsMarkAlertReadMutation",
    "operationKind": "mutation",
    "text": "mutation AlertOperationsMarkAlertReadMutation(\n  $id: ID!\n) {\n  markAlertRead(id: $id) {\n    event {\n      id\n      readAt\n    }\n    errors {\n      code\n      field\n      message\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "f1d9e6a9d53904604faecb1922ee35ed";

export default node;

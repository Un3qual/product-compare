/**
 * @generated SignedSource<<03c4715f587a0ec3d9291cd427259315>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type MarkAlertReadMutation$variables = {
  id: string;
};
export type MarkAlertReadMutation$data = {
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
export type MarkAlertReadMutation = {
  response: MarkAlertReadMutation$data;
  variables: MarkAlertReadMutation$variables;
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
    "name": "MarkAlertReadMutation",
    "selections": (v1/*: any*/),
    "type": "RootMutationType",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "MarkAlertReadMutation",
    "selections": (v1/*: any*/)
  },
  "params": {
    "cacheID": "14f79d5ae617409b48d4b15f36e4fa1d",
    "id": null,
    "metadata": {},
    "name": "MarkAlertReadMutation",
    "operationKind": "mutation",
    "text": "mutation MarkAlertReadMutation(\n  $id: ID!\n) {\n  markAlertRead(id: $id) {\n    event {\n      id\n      readAt\n    }\n    errors {\n      code\n      field\n      message\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "2d9c81a25bb216c33abbb81b8d89b450";

export default node;

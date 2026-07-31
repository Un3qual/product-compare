/**
 * @generated SignedSource<<6c7f12c6ab6ff9b02e488334733b03d9>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type AlertsRouteMarkAlertReadMutation$variables = {
  id: string;
};
export type AlertsRouteMarkAlertReadMutation$data = {
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
export type AlertsRouteMarkAlertReadMutation = {
  response: AlertsRouteMarkAlertReadMutation$data;
  variables: AlertsRouteMarkAlertReadMutation$variables;
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
    "name": "AlertsRouteMarkAlertReadMutation",
    "selections": (v1/*: any*/),
    "type": "RootMutationType",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "AlertsRouteMarkAlertReadMutation",
    "selections": (v1/*: any*/)
  },
  "params": {
    "cacheID": "33dac9de8d6c385592f10e96440b566d",
    "id": null,
    "metadata": {},
    "name": "AlertsRouteMarkAlertReadMutation",
    "operationKind": "mutation",
    "text": "mutation AlertsRouteMarkAlertReadMutation(\n  $id: ID!\n) {\n  markAlertRead(id: $id) {\n    event {\n      id\n      readAt\n    }\n    errors {\n      code\n      field\n      message\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "59d0570f118afacc3201364d15177a05";

export default node;

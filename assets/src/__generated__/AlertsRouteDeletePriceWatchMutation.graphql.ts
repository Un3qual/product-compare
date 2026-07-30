/**
 * @generated SignedSource<<72b98637de5499765403798db1c0f46a>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type AlertsRouteDeletePriceWatchMutation$variables = {
  id: string;
};
export type AlertsRouteDeletePriceWatchMutation$data = {
  readonly deletePriceWatch: {
    readonly deletedWatchId: string | null | undefined;
    readonly errors: ReadonlyArray<{
      readonly code: string;
      readonly field: string | null | undefined;
      readonly message: string;
    }>;
  };
};
export type AlertsRouteDeletePriceWatchMutation = {
  response: AlertsRouteDeletePriceWatchMutation$data;
  variables: AlertsRouteDeletePriceWatchMutation$variables;
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
    "concreteType": "DeletePriceWatchPayload",
    "kind": "LinkedField",
    "name": "deletePriceWatch",
    "plural": false,
    "selections": [
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "deletedWatchId",
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
    "name": "AlertsRouteDeletePriceWatchMutation",
    "selections": (v1/*: any*/),
    "type": "RootMutationType",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "AlertsRouteDeletePriceWatchMutation",
    "selections": (v1/*: any*/)
  },
  "params": {
    "cacheID": "272b1775bc8d02d28094434b0e5fbf8c",
    "id": null,
    "metadata": {},
    "name": "AlertsRouteDeletePriceWatchMutation",
    "operationKind": "mutation",
    "text": "mutation AlertsRouteDeletePriceWatchMutation(\n  $id: ID!\n) {\n  deletePriceWatch(id: $id) {\n    deletedWatchId\n    errors {\n      code\n      field\n      message\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "4223f199418562ec48a07cf0f39a3ec0";

export default node;

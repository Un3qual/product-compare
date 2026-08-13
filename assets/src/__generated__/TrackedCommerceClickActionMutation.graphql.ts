/**
 * @generated SignedSource<<8a4ad65075144e969f5b431919ba9c93>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type TrackCommerceClickInput = {
  merchantProductId: string;
};
export type TrackedCommerceClickActionMutation$variables = {
  input: TrackCommerceClickInput;
};
export type TrackedCommerceClickActionMutation$data = {
  readonly trackCommerceClick: {
    readonly errors: ReadonlyArray<{
      readonly code: string;
      readonly field: string | null;
      readonly message: string;
    }>;
    readonly redirectPath: string | null;
  };
};
export type TrackedCommerceClickActionMutation = {
  response: TrackedCommerceClickActionMutation$data;
  variables: TrackedCommerceClickActionMutation$variables;
};

const node: ConcreteRequest = (function(){
var v0 = [
  {
    "defaultValue": null,
    "kind": "LocalArgument",
    "name": "input"
  }
],
v1 = [
  {
    "alias": null,
    "args": [
      {
        "kind": "Variable",
        "name": "input",
        "variableName": "input"
      }
    ],
    "concreteType": "TrackCommerceClickPayload",
    "kind": "LinkedField",
    "name": "trackCommerceClick",
    "plural": false,
    "selections": [
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "redirectPath",
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
    "name": "TrackedCommerceClickActionMutation",
    "selections": (v1/*: any*/),
    "type": "RootMutationType",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "TrackedCommerceClickActionMutation",
    "selections": (v1/*: any*/)
  },
  "params": {
    "cacheID": "31f5e4874b9bead2ddca816d0de9dbc7",
    "id": null,
    "metadata": {},
    "name": "TrackedCommerceClickActionMutation",
    "operationKind": "mutation",
    "text": "mutation TrackedCommerceClickActionMutation(\n  $input: TrackCommerceClickInput!\n) {\n  trackCommerceClick(input: $input) {\n    redirectPath\n    errors {\n      code\n      field\n      message\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "6afdb35ec8a48933dd0b8aef8c9bcd77";

export default node;

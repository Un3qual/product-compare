/**
 * @generated SignedSource<<87207a7d23f918d33b1da9efcfed5c68>>
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
export type TrackCommerceClickMutation$variables = {
  input: TrackCommerceClickInput;
};
export type TrackCommerceClickMutation$data = {
  readonly trackCommerceClick: {
    readonly errors: ReadonlyArray<{
      readonly code: string;
      readonly field: string | null | undefined;
      readonly message: string;
    }>;
    readonly redirectPath: string | null | undefined;
  };
};
export type TrackCommerceClickMutation = {
  response: TrackCommerceClickMutation$data;
  variables: TrackCommerceClickMutation$variables;
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
    "name": "TrackCommerceClickMutation",
    "selections": (v1/*: any*/),
    "type": "Mutation",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "TrackCommerceClickMutation",
    "selections": (v1/*: any*/)
  },
  "params": {
    "cacheID": "d2e858fc2f0536db9860a992c706797b",
    "id": null,
    "metadata": {},
    "name": "TrackCommerceClickMutation",
    "operationKind": "mutation",
    "text": "mutation TrackCommerceClickMutation(\n  $input: TrackCommerceClickInput!\n) {\n  trackCommerceClick(input: $input) {\n    redirectPath\n    errors {\n      code\n      field\n      message\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "d12d853e27e680de95c836b1ec6386f5";

export default node;

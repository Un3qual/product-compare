/**
 * @generated SignedSource<<0668bb8dc77028b831e6313f19acfcb7>>
 * @lightSyntaxTransform
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type VerifyEmailRouteMutation$variables = {
  token: string;
};
export type VerifyEmailRouteMutation$data = {
  readonly verifyEmail: {
    readonly errors: ReadonlyArray<{
      readonly code: string;
      readonly field: string | null;
      readonly message: string;
    }>;
    readonly ok: boolean;
  };
};
export type VerifyEmailRouteMutation = {
  response: VerifyEmailRouteMutation$data;
  variables: VerifyEmailRouteMutation$variables;
};

const node: ConcreteRequest = (function(){
var v0 = [
  {
    "defaultValue": null,
    "kind": "LocalArgument",
    "name": "token"
  }
],
v1 = [
  {
    "alias": null,
    "args": [
      {
        "kind": "Variable",
        "name": "token",
        "variableName": "token"
      }
    ],
    "concreteType": "AuthActionPayload",
    "kind": "LinkedField",
    "name": "verifyEmail",
    "plural": false,
    "selections": [
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "ok",
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
    "argumentDefinitions": (v0/*:: as any*/),
    "kind": "Fragment",
    "metadata": null,
    "name": "VerifyEmailRouteMutation",
    "selections": (v1/*:: as any*/),
    "type": "RootMutationType",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*:: as any*/),
    "kind": "Operation",
    "name": "VerifyEmailRouteMutation",
    "selections": (v1/*:: as any*/)
  },
  "params": {
    "cacheID": "9b8bc1e5536976fd8865b42f71018208",
    "id": null,
    "metadata": {},
    "name": "VerifyEmailRouteMutation",
    "operationKind": "mutation",
    "text": "mutation VerifyEmailRouteMutation(\n  $token: String!\n) {\n  verifyEmail(token: $token) {\n    ok\n    errors {\n      code\n      field\n      message\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "1ed8433f0b1e60dd3ad9cc18fcfd0739";

export default node;

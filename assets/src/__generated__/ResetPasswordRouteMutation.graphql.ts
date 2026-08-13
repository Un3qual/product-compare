/**
 * @generated SignedSource<<bad9dd210d46827ecf250ea4182fd7c2>>
 * @lightSyntaxTransform
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type ResetPasswordRouteMutation$variables = {
  password: string;
  token: string;
};
export type ResetPasswordRouteMutation$data = {
  readonly resetPassword: {
    readonly errors: ReadonlyArray<{
      readonly code: string;
      readonly field: string | null;
      readonly message: string;
    }>;
    readonly ok: boolean;
  };
};
export type ResetPasswordRouteMutation = {
  response: ResetPasswordRouteMutation$data;
  variables: ResetPasswordRouteMutation$variables;
};

const node: ConcreteRequest = (function(){
var v0 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "password"
},
v1 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "token"
},
v2 = [
  {
    "alias": null,
    "args": [
      {
        "kind": "Variable",
        "name": "password",
        "variableName": "password"
      },
      {
        "kind": "Variable",
        "name": "token",
        "variableName": "token"
      }
    ],
    "concreteType": "AuthActionPayload",
    "kind": "LinkedField",
    "name": "resetPassword",
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
    "argumentDefinitions": [
      (v0/*:: as any*/),
      (v1/*:: as any*/)
    ],
    "kind": "Fragment",
    "metadata": null,
    "name": "ResetPasswordRouteMutation",
    "selections": (v2/*:: as any*/),
    "type": "RootMutationType",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": [
      (v1/*:: as any*/),
      (v0/*:: as any*/)
    ],
    "kind": "Operation",
    "name": "ResetPasswordRouteMutation",
    "selections": (v2/*:: as any*/)
  },
  "params": {
    "cacheID": "e59c618907848c2b36842dba34cfbaad",
    "id": null,
    "metadata": {},
    "name": "ResetPasswordRouteMutation",
    "operationKind": "mutation",
    "text": "mutation ResetPasswordRouteMutation(\n  $token: String!\n  $password: String!\n) {\n  resetPassword(token: $token, password: $password) {\n    ok\n    errors {\n      code\n      field\n      message\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "c2306626022f81fcc30145e99b889060";

export default node;

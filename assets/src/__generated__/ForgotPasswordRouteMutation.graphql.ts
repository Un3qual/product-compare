/**
 * @generated SignedSource<<7a0d515252708d2aa731500d0ef00408>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type ForgotPasswordRouteMutation$variables = {
  email: string;
};
export type ForgotPasswordRouteMutation$data = {
  readonly forgotPassword: {
    readonly errors: ReadonlyArray<{
      readonly code: string;
      readonly field: string | null;
      readonly message: string;
    }>;
    readonly ok: boolean;
  };
};
export type ForgotPasswordRouteMutation = {
  response: ForgotPasswordRouteMutation$data;
  variables: ForgotPasswordRouteMutation$variables;
};

const node: ConcreteRequest = (function(){
var v0 = [
  {
    "defaultValue": null,
    "kind": "LocalArgument",
    "name": "email"
  }
],
v1 = [
  {
    "alias": null,
    "args": [
      {
        "kind": "Variable",
        "name": "email",
        "variableName": "email"
      }
    ],
    "concreteType": "AuthActionPayload",
    "kind": "LinkedField",
    "name": "forgotPassword",
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
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Fragment",
    "metadata": null,
    "name": "ForgotPasswordRouteMutation",
    "selections": (v1/*: any*/),
    "type": "RootMutationType",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "ForgotPasswordRouteMutation",
    "selections": (v1/*: any*/)
  },
  "params": {
    "cacheID": "9df8f11e32f8f3b03ed5c91d7544e628",
    "id": null,
    "metadata": {},
    "name": "ForgotPasswordRouteMutation",
    "operationKind": "mutation",
    "text": "mutation ForgotPasswordRouteMutation(\n  $email: String!\n) {\n  forgotPassword(email: $email) {\n    ok\n    errors {\n      code\n      field\n      message\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "dc9ba957467e99c45906f7923a6b46bc";

export default node;

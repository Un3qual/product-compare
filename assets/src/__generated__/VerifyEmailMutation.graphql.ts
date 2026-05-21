/**
 * @generated SignedSource<<d33473a17b9bf352c6955cc46bbe9244>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type VerifyEmailMutation$variables = {
  token: string;
};
export type VerifyEmailMutation$data = {
  readonly verifyEmail: {
    readonly errors: ReadonlyArray<{
      readonly code: string;
      readonly field: string | null | undefined;
      readonly message: string;
    }>;
    readonly ok: boolean;
  };
};
export type VerifyEmailMutation = {
  response: VerifyEmailMutation$data;
  variables: VerifyEmailMutation$variables;
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
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Fragment",
    "metadata": null,
    "name": "VerifyEmailMutation",
    "selections": (v1/*: any*/),
    "type": "Mutation",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "VerifyEmailMutation",
    "selections": (v1/*: any*/)
  },
  "params": {
    "cacheID": "56eb506bc47c86d159d7f8ae71796af8",
    "id": null,
    "metadata": {},
    "name": "VerifyEmailMutation",
    "operationKind": "mutation",
    "text": "mutation VerifyEmailMutation(\n  $token: String!\n) {\n  verifyEmail(token: $token) {\n    ok\n    errors {\n      code\n      field\n      message\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "7c72342d97325923ef4dcbd7eabca8af";

export default node;

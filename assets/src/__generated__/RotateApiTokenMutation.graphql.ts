/**
 * @generated SignedSource<<51b521b3db3f7d2aa0b648305a8ac232>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type RotateApiTokenMutation$variables = {
  expiresAt?: any | null | undefined;
  label?: string | null | undefined;
  tokenId: string;
};
export type RotateApiTokenMutation$data = {
  readonly rotateApiToken: {
    readonly apiToken: {
      readonly expiresAt: any | null | undefined;
      readonly id: string;
      readonly insertedAt: any;
      readonly label: string | null | undefined;
      readonly lastUsedAt: any | null | undefined;
      readonly revokedAt: any | null | undefined;
      readonly tokenPrefix: string;
    } | null | undefined;
    readonly errors: ReadonlyArray<{
      readonly code: string;
      readonly field: string | null | undefined;
      readonly message: string;
    }>;
    readonly plainTextToken: string | null | undefined;
  };
};
export type RotateApiTokenMutation = {
  response: RotateApiTokenMutation$data;
  variables: RotateApiTokenMutation$variables;
};

const node: ConcreteRequest = (function(){
var v0 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "expiresAt"
},
v1 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "label"
},
v2 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "tokenId"
},
v3 = [
  {
    "alias": null,
    "args": [
      {
        "kind": "Variable",
        "name": "expiresAt",
        "variableName": "expiresAt"
      },
      {
        "kind": "Variable",
        "name": "label",
        "variableName": "label"
      },
      {
        "kind": "Variable",
        "name": "tokenId",
        "variableName": "tokenId"
      }
    ],
    "concreteType": "CreateApiTokenPayload",
    "kind": "LinkedField",
    "name": "rotateApiToken",
    "plural": false,
    "selections": [
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "plainTextToken",
        "storageKey": null
      },
      {
        "alias": null,
        "args": null,
        "concreteType": "ApiToken",
        "kind": "LinkedField",
        "name": "apiToken",
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
            "name": "label",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "tokenPrefix",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "lastUsedAt",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "expiresAt",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "revokedAt",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "insertedAt",
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
            "name": "message",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "field",
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
      (v0/*: any*/),
      (v1/*: any*/),
      (v2/*: any*/)
    ],
    "kind": "Fragment",
    "metadata": null,
    "name": "RotateApiTokenMutation",
    "selections": (v3/*: any*/),
    "type": "Mutation",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": [
      (v2/*: any*/),
      (v1/*: any*/),
      (v0/*: any*/)
    ],
    "kind": "Operation",
    "name": "RotateApiTokenMutation",
    "selections": (v3/*: any*/)
  },
  "params": {
    "cacheID": "d04ccb24d794326ff52aabba42ab9e3e",
    "id": null,
    "metadata": {},
    "name": "RotateApiTokenMutation",
    "operationKind": "mutation",
    "text": "mutation RotateApiTokenMutation(\n  $tokenId: ID!\n  $label: String\n  $expiresAt: DateTime\n) {\n  rotateApiToken(tokenId: $tokenId, label: $label, expiresAt: $expiresAt) {\n    plainTextToken\n    apiToken {\n      id\n      label\n      tokenPrefix\n      lastUsedAt\n      expiresAt\n      revokedAt\n      insertedAt\n    }\n    errors {\n      code\n      message\n      field\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "5559e3431fc2afdd48cdeb809f86468a";

export default node;

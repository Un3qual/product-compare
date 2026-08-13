/**
 * @generated SignedSource<<5d45137d502c7ae82023acbf9a1fb151>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type ApiTokenOperationsRevokeApiTokenMutation$variables = {
  tokenId: string;
};
export type ApiTokenOperationsRevokeApiTokenMutation$data = {
  readonly revokeApiToken: {
    readonly apiToken: {
      readonly expiresAt: string | null;
      readonly id: string;
      readonly insertedAt: string;
      readonly label: string | null;
      readonly lastUsedAt: string | null;
      readonly revokedAt: string | null;
      readonly tokenPrefix: string;
    } | null;
    readonly errors: ReadonlyArray<{
      readonly code: string;
      readonly field: string | null;
      readonly message: string;
    }>;
  };
};
export type ApiTokenOperationsRevokeApiTokenMutation = {
  response: ApiTokenOperationsRevokeApiTokenMutation$data;
  variables: ApiTokenOperationsRevokeApiTokenMutation$variables;
};

const node: ConcreteRequest = (function(){
var v0 = [
  {
    "defaultValue": null,
    "kind": "LocalArgument",
    "name": "tokenId"
  }
],
v1 = [
  {
    "alias": null,
    "args": [
      {
        "kind": "Variable",
        "name": "tokenId",
        "variableName": "tokenId"
      }
    ],
    "concreteType": "RevokeApiTokenPayload",
    "kind": "LinkedField",
    "name": "revokeApiToken",
    "plural": false,
    "selections": [
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
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Fragment",
    "metadata": null,
    "name": "ApiTokenOperationsRevokeApiTokenMutation",
    "selections": (v1/*: any*/),
    "type": "RootMutationType",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "ApiTokenOperationsRevokeApiTokenMutation",
    "selections": (v1/*: any*/)
  },
  "params": {
    "cacheID": "641446743583d4dc629f40cb918ae54b",
    "id": null,
    "metadata": {},
    "name": "ApiTokenOperationsRevokeApiTokenMutation",
    "operationKind": "mutation",
    "text": "mutation ApiTokenOperationsRevokeApiTokenMutation(\n  $tokenId: ID!\n) {\n  revokeApiToken(tokenId: $tokenId) {\n    apiToken {\n      id\n      label\n      tokenPrefix\n      lastUsedAt\n      expiresAt\n      revokedAt\n      insertedAt\n    }\n    errors {\n      code\n      message\n      field\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "ee7fce6456c9a795f344381b7397146f";

export default node;

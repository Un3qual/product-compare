/**
 * @generated SignedSource<<64798b7c80fc44d00858a8411b9bd6d3>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type ApiTokensRouteRotateApiTokenMutation$variables = {
  expiresAt?: any | null | undefined;
  label?: string | null | undefined;
  tokenId: string;
};
export type ApiTokensRouteRotateApiTokenMutation$data = {
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
export type ApiTokensRouteRotateApiTokenMutation = {
  response: ApiTokensRouteRotateApiTokenMutation$data;
  variables: ApiTokensRouteRotateApiTokenMutation$variables;
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
    "name": "ApiTokensRouteRotateApiTokenMutation",
    "selections": (v3/*: any*/),
    "type": "RootMutationType",
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
    "name": "ApiTokensRouteRotateApiTokenMutation",
    "selections": (v3/*: any*/)
  },
  "params": {
    "cacheID": "0b6822cb6a45173ff6baf47cabbe9b09",
    "id": null,
    "metadata": {},
    "name": "ApiTokensRouteRotateApiTokenMutation",
    "operationKind": "mutation",
    "text": "mutation ApiTokensRouteRotateApiTokenMutation(\n  $tokenId: ID!\n  $label: String\n  $expiresAt: DateTime\n) {\n  rotateApiToken(tokenId: $tokenId, label: $label, expiresAt: $expiresAt) {\n    plainTextToken\n    apiToken {\n      id\n      label\n      tokenPrefix\n      lastUsedAt\n      expiresAt\n      revokedAt\n      insertedAt\n    }\n    errors {\n      code\n      message\n      field\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "7980604e9ec9ceb7da392e6b948dd465";

export default node;

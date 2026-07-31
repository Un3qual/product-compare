/**
 * @generated SignedSource<<03c9a63c764156c3b5e10715508aeef8>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type ApiTokenOperationsCreateApiTokenMutation$variables = {
  expiresAt?: any | null | undefined;
  label?: string | null | undefined;
};
export type ApiTokenOperationsCreateApiTokenMutation$data = {
  readonly createApiToken: {
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
export type ApiTokenOperationsCreateApiTokenMutation = {
  response: ApiTokenOperationsCreateApiTokenMutation$data;
  variables: ApiTokenOperationsCreateApiTokenMutation$variables;
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
v2 = [
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
      }
    ],
    "concreteType": "CreateApiTokenPayload",
    "kind": "LinkedField",
    "name": "createApiToken",
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
      (v1/*: any*/)
    ],
    "kind": "Fragment",
    "metadata": null,
    "name": "ApiTokenOperationsCreateApiTokenMutation",
    "selections": (v2/*: any*/),
    "type": "RootMutationType",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": [
      (v1/*: any*/),
      (v0/*: any*/)
    ],
    "kind": "Operation",
    "name": "ApiTokenOperationsCreateApiTokenMutation",
    "selections": (v2/*: any*/)
  },
  "params": {
    "cacheID": "05c62eea1dbe7c021e02b2434b2f40cb",
    "id": null,
    "metadata": {},
    "name": "ApiTokenOperationsCreateApiTokenMutation",
    "operationKind": "mutation",
    "text": "mutation ApiTokenOperationsCreateApiTokenMutation(\n  $label: String\n  $expiresAt: DateTime\n) {\n  createApiToken(label: $label, expiresAt: $expiresAt) {\n    plainTextToken\n    apiToken {\n      id\n      label\n      tokenPrefix\n      lastUsedAt\n      expiresAt\n      revokedAt\n      insertedAt\n    }\n    errors {\n      code\n      message\n      field\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "38a054306c2abf6899db3a470a28e7f6";

export default node;

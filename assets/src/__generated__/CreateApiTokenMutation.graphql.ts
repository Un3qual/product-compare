/**
 * @generated SignedSource<<b1187e2ecbac69f4b3167a6e31211a5e>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type CreateApiTokenMutation$variables = {
  expiresAt?: any | null | undefined;
  label?: string | null | undefined;
};
export type CreateApiTokenMutation$data = {
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
export type CreateApiTokenMutation = {
  response: CreateApiTokenMutation$data;
  variables: CreateApiTokenMutation$variables;
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
    "name": "CreateApiTokenMutation",
    "selections": (v2/*: any*/),
    "type": "Mutation",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": [
      (v1/*: any*/),
      (v0/*: any*/)
    ],
    "kind": "Operation",
    "name": "CreateApiTokenMutation",
    "selections": (v2/*: any*/)
  },
  "params": {
    "cacheID": "9ac7cfa62ffdb13dfe1239c97fccc300",
    "id": null,
    "metadata": {},
    "name": "CreateApiTokenMutation",
    "operationKind": "mutation",
    "text": "mutation CreateApiTokenMutation(\n  $label: String\n  $expiresAt: DateTime\n) {\n  createApiToken(label: $label, expiresAt: $expiresAt) {\n    plainTextToken\n    apiToken {\n      id\n      label\n      tokenPrefix\n      lastUsedAt\n      expiresAt\n      revokedAt\n      insertedAt\n    }\n    errors {\n      code\n      message\n      field\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "daa28c9df90af5e0a2deb7fb79da2127";

export default node;

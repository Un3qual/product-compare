/**
 * @generated SignedSource<<36b08f1bcb2836a2f49be412cb5b2c65>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type ApiTokenStatusFilter = "ACTIVE" | "ALL" | "REVOKED" | "%future added value";
export type ApiTokensRouteQuery$variables = {
  after?: string | null | undefined;
  first: number;
  status?: ApiTokenStatusFilter | null | undefined;
};
export type ApiTokensRouteQuery$data = {
  readonly myApiTokens: {
    readonly edges: ReadonlyArray<{
      readonly cursor: string;
      readonly node: {
        readonly expiresAt: any | null | undefined;
        readonly id: string;
        readonly insertedAt: any;
        readonly label: string | null | undefined;
        readonly lastUsedAt: any | null | undefined;
        readonly revokedAt: any | null | undefined;
        readonly tokenPrefix: string;
      };
    }>;
    readonly pageInfo: {
      readonly endCursor: string | null | undefined;
      readonly hasNextPage: boolean;
      readonly hasPreviousPage: boolean;
      readonly startCursor: string | null | undefined;
    };
  };
};
export type ApiTokensRouteQuery = {
  response: ApiTokensRouteQuery$data;
  variables: ApiTokensRouteQuery$variables;
};

const node: ConcreteRequest = (function(){
var v0 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "after"
},
v1 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "first"
},
v2 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "status"
},
v3 = [
  {
    "alias": null,
    "args": [
      {
        "kind": "Variable",
        "name": "after",
        "variableName": "after"
      },
      {
        "kind": "Variable",
        "name": "first",
        "variableName": "first"
      },
      {
        "kind": "Variable",
        "name": "status",
        "variableName": "status"
      }
    ],
    "concreteType": "ApiTokenConnection",
    "kind": "LinkedField",
    "name": "myApiTokens",
    "plural": false,
    "selections": [
      {
        "alias": null,
        "args": null,
        "concreteType": "ApiTokenEdge",
        "kind": "LinkedField",
        "name": "edges",
        "plural": true,
        "selections": [
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "cursor",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "concreteType": "ApiToken",
            "kind": "LinkedField",
            "name": "node",
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
          }
        ],
        "storageKey": null
      },
      {
        "alias": null,
        "args": null,
        "concreteType": "PageInfo",
        "kind": "LinkedField",
        "name": "pageInfo",
        "plural": false,
        "selections": [
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "hasNextPage",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "hasPreviousPage",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "startCursor",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "endCursor",
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
    "name": "ApiTokensRouteQuery",
    "selections": (v3/*: any*/),
    "type": "Query",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": [
      (v1/*: any*/),
      (v0/*: any*/),
      (v2/*: any*/)
    ],
    "kind": "Operation",
    "name": "ApiTokensRouteQuery",
    "selections": (v3/*: any*/)
  },
  "params": {
    "cacheID": "5a99fcac6efffea4be88bf4504d42f0c",
    "id": null,
    "metadata": {},
    "name": "ApiTokensRouteQuery",
    "operationKind": "query",
    "text": "query ApiTokensRouteQuery(\n  $first: Int!\n  $after: String\n  $status: ApiTokenStatusFilter\n) {\n  myApiTokens(first: $first, after: $after, status: $status) {\n    edges {\n      cursor\n      node {\n        id\n        label\n        tokenPrefix\n        lastUsedAt\n        expiresAt\n        revokedAt\n        insertedAt\n      }\n    }\n    pageInfo {\n      hasNextPage\n      hasPreviousPage\n      startCursor\n      endCursor\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "4f30aee2bb7fac3f3ffa17ce423ecc43";

export default node;

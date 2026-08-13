/**
 * @generated SignedSource<<87edb7c9c45edc04b93bf81201b919f1>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
import { FragmentRefs } from "relay-runtime";
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
        readonly expiresAt: string | null | undefined;
        readonly id: string;
        readonly insertedAt: string;
        readonly label: string | null | undefined;
        readonly lastUsedAt: string | null | undefined;
        readonly revokedAt: string | null | undefined;
        readonly tokenPrefix: string;
        readonly " $fragmentSpreads": FragmentRefs<"ApiTokenItem_token">;
      };
    }>;
    readonly pageInfo: {
      readonly endCursor: string | null | undefined;
      readonly hasNextPage: boolean;
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
v4 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "cursor",
  "storageKey": null
},
v5 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "id",
  "storageKey": null
},
v6 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "label",
  "storageKey": null
},
v7 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "tokenPrefix",
  "storageKey": null
},
v8 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "lastUsedAt",
  "storageKey": null
},
v9 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "expiresAt",
  "storageKey": null
},
v10 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "revokedAt",
  "storageKey": null
},
v11 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "insertedAt",
  "storageKey": null
},
v12 = {
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
      "name": "endCursor",
      "storageKey": null
    }
  ],
  "storageKey": null
};
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
    "selections": [
      {
        "alias": null,
        "args": (v3/*: any*/),
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
              (v4/*: any*/),
              {
                "alias": null,
                "args": null,
                "concreteType": "ApiToken",
                "kind": "LinkedField",
                "name": "node",
                "plural": false,
                "selections": [
                  (v5/*: any*/),
                  (v6/*: any*/),
                  (v7/*: any*/),
                  (v8/*: any*/),
                  (v9/*: any*/),
                  (v10/*: any*/),
                  (v11/*: any*/),
                  {
                    "args": null,
                    "kind": "FragmentSpread",
                    "name": "ApiTokenItem_token"
                  }
                ],
                "storageKey": null
              }
            ],
            "storageKey": null
          },
          (v12/*: any*/)
        ],
        "storageKey": null
      }
    ],
    "type": "RootQueryType",
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
    "selections": [
      {
        "alias": null,
        "args": (v3/*: any*/),
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
              (v4/*: any*/),
              {
                "alias": null,
                "args": null,
                "concreteType": "ApiToken",
                "kind": "LinkedField",
                "name": "node",
                "plural": false,
                "selections": [
                  (v5/*: any*/),
                  (v6/*: any*/),
                  (v7/*: any*/),
                  (v8/*: any*/),
                  (v9/*: any*/),
                  (v10/*: any*/),
                  (v11/*: any*/)
                ],
                "storageKey": null
              }
            ],
            "storageKey": null
          },
          (v12/*: any*/)
        ],
        "storageKey": null
      }
    ]
  },
  "params": {
    "cacheID": "1a1ea85143dc1f185620e78138c371d2",
    "id": null,
    "metadata": {},
    "name": "ApiTokensRouteQuery",
    "operationKind": "query",
    "text": "query ApiTokensRouteQuery(\n  $first: Int!\n  $after: String\n  $status: ApiTokenStatusFilter\n) {\n  myApiTokens(first: $first, after: $after, status: $status) {\n    edges {\n      cursor\n      node {\n        id\n        label\n        tokenPrefix\n        lastUsedAt\n        expiresAt\n        revokedAt\n        insertedAt\n        ...ApiTokenItem_token\n      }\n    }\n    pageInfo {\n      hasNextPage\n      endCursor\n    }\n  }\n}\n\nfragment ApiTokenItem_token on ApiToken {\n  id\n  label\n  tokenPrefix\n  lastUsedAt\n  expiresAt\n  revokedAt\n  insertedAt\n}\n"
  }
};
})();

(node as any).hash = "74017161b3e1294fca5a219f8d549c4a";

export default node;

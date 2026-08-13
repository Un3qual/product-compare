/**
 * @generated SignedSource<<6c2757d24a9376e90c78c9661a262b1f>>
 * @lightSyntaxTransform
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
import { FragmentRefs } from "relay-runtime";
export type ApiTokenStatusFilter = "ACTIVE" | "ALL" | "REVOKED" | "%future added value";
export type ApiTokensRouteQuery$variables = {
  after?: string | null;
  first: number;
  status?: ApiTokenStatusFilter | null;
};
export type ApiTokensRouteQuery$data = {
  readonly myApiTokens: {
    readonly edges: ReadonlyArray<{
      readonly cursor: string;
      readonly node: {
        readonly expiresAt: string | null;
        readonly id: string;
        readonly insertedAt: string;
        readonly label: string | null;
        readonly lastUsedAt: string | null;
        readonly revokedAt: string | null;
        readonly tokenPrefix: string;
        readonly " $fragmentSpreads": FragmentRefs<"ApiTokenItem_token">;
      };
    }>;
    readonly pageInfo: {
      readonly endCursor: string | null;
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
      (v0/*:: as any*/),
      (v1/*:: as any*/),
      (v2/*:: as any*/)
    ],
    "kind": "Fragment",
    "metadata": null,
    "name": "ApiTokensRouteQuery",
    "selections": [
      {
        "alias": null,
        "args": (v3/*:: as any*/),
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
              (v4/*:: as any*/),
              {
                "alias": null,
                "args": null,
                "concreteType": "ApiToken",
                "kind": "LinkedField",
                "name": "node",
                "plural": false,
                "selections": [
                  (v5/*:: as any*/),
                  (v6/*:: as any*/),
                  (v7/*:: as any*/),
                  (v8/*:: as any*/),
                  (v9/*:: as any*/),
                  (v10/*:: as any*/),
                  (v11/*:: as any*/),
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
          (v12/*:: as any*/)
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
      (v1/*:: as any*/),
      (v0/*:: as any*/),
      (v2/*:: as any*/)
    ],
    "kind": "Operation",
    "name": "ApiTokensRouteQuery",
    "selections": [
      {
        "alias": null,
        "args": (v3/*:: as any*/),
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
              (v4/*:: as any*/),
              {
                "alias": null,
                "args": null,
                "concreteType": "ApiToken",
                "kind": "LinkedField",
                "name": "node",
                "plural": false,
                "selections": [
                  (v5/*:: as any*/),
                  (v6/*:: as any*/),
                  (v7/*:: as any*/),
                  (v8/*:: as any*/),
                  (v9/*:: as any*/),
                  (v10/*:: as any*/),
                  (v11/*:: as any*/)
                ],
                "storageKey": null
              }
            ],
            "storageKey": null
          },
          (v12/*:: as any*/)
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

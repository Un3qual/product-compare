/**
 * @generated SignedSource<<470867b98ed361ba2c0a3d4e87ccbe9a>>
 * @lightSyntaxTransform
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
import { FragmentRefs } from "relay-runtime";
export type SavedComparisonsRouteQuery$variables = {
  after?: string | null;
  first: number;
};
export type SavedComparisonsRouteQuery$data = {
  readonly mySavedComparisonSets: {
    readonly pageInfo: {
      readonly endCursor: string | null;
      readonly hasNextPage: boolean;
    };
    readonly " $fragmentSpreads": FragmentRefs<"SavedComparisonSetList_savedSets">;
  } | null;
};
export type SavedComparisonsRouteQuery = {
  response: SavedComparisonsRouteQuery$data;
  variables: SavedComparisonsRouteQuery$variables;
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
v2 = [
  {
    "kind": "Variable",
    "name": "after",
    "variableName": "after"
  },
  {
    "kind": "Variable",
    "name": "first",
    "variableName": "first"
  }
],
v3 = {
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
},
v4 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "id",
  "storageKey": null
},
v5 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "name",
  "storageKey": null
};
return {
  "fragment": {
    "argumentDefinitions": [
      (v0/*:: as any*/),
      (v1/*:: as any*/)
    ],
    "kind": "Fragment",
    "metadata": null,
    "name": "SavedComparisonsRouteQuery",
    "selections": [
      {
        "alias": null,
        "args": (v2/*:: as any*/),
        "concreteType": "SavedComparisonSetConnection",
        "kind": "LinkedField",
        "name": "mySavedComparisonSets",
        "plural": false,
        "selections": [
          {
            "args": null,
            "kind": "FragmentSpread",
            "name": "SavedComparisonSetList_savedSets"
          },
          (v3/*:: as any*/)
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
      (v0/*:: as any*/)
    ],
    "kind": "Operation",
    "name": "SavedComparisonsRouteQuery",
    "selections": [
      {
        "alias": null,
        "args": (v2/*:: as any*/),
        "concreteType": "SavedComparisonSetConnection",
        "kind": "LinkedField",
        "name": "mySavedComparisonSets",
        "plural": false,
        "selections": [
          {
            "alias": null,
            "args": null,
            "concreteType": "SavedComparisonSetEdge",
            "kind": "LinkedField",
            "name": "edges",
            "plural": true,
            "selections": [
              {
                "alias": null,
                "args": null,
                "concreteType": "SavedComparisonSet",
                "kind": "LinkedField",
                "name": "node",
                "plural": false,
                "selections": [
                  (v4/*:: as any*/),
                  (v5/*:: as any*/),
                  {
                    "alias": null,
                    "args": null,
                    "concreteType": "SavedComparisonItem",
                    "kind": "LinkedField",
                    "name": "items",
                    "plural": true,
                    "selections": [
                      {
                        "alias": null,
                        "args": null,
                        "kind": "ScalarField",
                        "name": "position",
                        "storageKey": null
                      },
                      {
                        "alias": null,
                        "args": null,
                        "concreteType": "Product",
                        "kind": "LinkedField",
                        "name": "product",
                        "plural": false,
                        "selections": [
                          (v5/*:: as any*/),
                          {
                            "alias": null,
                            "args": null,
                            "kind": "ScalarField",
                            "name": "slug",
                            "storageKey": null
                          },
                          (v4/*:: as any*/)
                        ],
                        "storageKey": null
                      }
                    ],
                    "storageKey": null
                  }
                ],
                "storageKey": null
              }
            ],
            "storageKey": null
          },
          (v3/*:: as any*/)
        ],
        "storageKey": null
      }
    ]
  },
  "params": {
    "cacheID": "6d21502465765c9ce772ceff8a530306",
    "id": null,
    "metadata": {},
    "name": "SavedComparisonsRouteQuery",
    "operationKind": "query",
    "text": "query SavedComparisonsRouteQuery(\n  $first: Int!\n  $after: String\n) {\n  mySavedComparisonSets(first: $first, after: $after) {\n    ...SavedComparisonSetList_savedSets\n    pageInfo {\n      hasNextPage\n      endCursor\n    }\n  }\n}\n\nfragment SavedComparisonSetList_savedSets on SavedComparisonSetConnection {\n  edges {\n    node {\n      id\n      name\n      items {\n        position\n        product {\n          name\n          slug\n          id\n        }\n      }\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "1654f8743babdf6cd813135ed2bffc99";

export default node;

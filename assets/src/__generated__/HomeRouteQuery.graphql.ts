/**
 * @generated SignedSource<<810f0e06801657c3db71a4ebcb2f58b4>>
 * @lightSyntaxTransform
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
import { FragmentRefs } from "relay-runtime";
export type HomeRouteQuery$variables = {
  first: number;
  selectedSlugs: ReadonlyArray<string>;
};
export type HomeRouteQuery$data = {
  readonly homeWorkspace: {
    readonly categories: {
      readonly edges: ReadonlyArray<{
        readonly node: {
          readonly description: string;
          readonly id: string;
          readonly name: string;
          readonly slug: string;
        };
      }>;
    };
    readonly products: {
      readonly edges: ReadonlyArray<{
        readonly cursor: string;
      }>;
      readonly " $fragmentSpreads": FragmentRefs<"HomeProductLedger_products">;
    };
    readonly selectedProducts: ReadonlyArray<{
      readonly id: string;
      readonly name: string;
      readonly slug: string;
    }>;
  };
};
export type HomeRouteQuery = {
  response: HomeRouteQuery$data;
  variables: HomeRouteQuery$variables;
};

const node: ConcreteRequest = (function(){
var v0 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "first"
},
v1 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "selectedSlugs"
},
v2 = [
  {
    "kind": "Variable",
    "name": "selectedSlugs",
    "variableName": "selectedSlugs"
  }
],
v3 = [
  {
    "kind": "Variable",
    "name": "first",
    "variableName": "first"
  }
],
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
},
v6 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "slug",
  "storageKey": null
},
v7 = {
  "alias": null,
  "args": (v3/*:: as any*/),
  "concreteType": "HomeCategoryShortcutsConnection",
  "kind": "LinkedField",
  "name": "categories",
  "plural": false,
  "selections": [
    {
      "alias": null,
      "args": null,
      "concreteType": "HomeCategoryShortcutsEdge",
      "kind": "LinkedField",
      "name": "edges",
      "plural": true,
      "selections": [
        {
          "alias": null,
          "args": null,
          "concreteType": "SeoCategory",
          "kind": "LinkedField",
          "name": "node",
          "plural": false,
          "selections": [
            (v4/*:: as any*/),
            (v5/*:: as any*/),
            (v6/*:: as any*/),
            {
              "alias": null,
              "args": null,
              "kind": "ScalarField",
              "name": "description",
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
v8 = [
  (v4/*:: as any*/),
  (v5/*:: as any*/),
  (v6/*:: as any*/)
],
v9 = {
  "alias": null,
  "args": null,
  "concreteType": "Product",
  "kind": "LinkedField",
  "name": "selectedProducts",
  "plural": true,
  "selections": (v8/*:: as any*/),
  "storageKey": null
},
v10 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "cursor",
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
    "name": "HomeRouteQuery",
    "selections": [
      {
        "alias": null,
        "args": (v2/*:: as any*/),
        "concreteType": "HomeWorkspace",
        "kind": "LinkedField",
        "name": "homeWorkspace",
        "plural": false,
        "selections": [
          (v7/*:: as any*/),
          (v9/*:: as any*/),
          {
            "alias": null,
            "args": (v3/*:: as any*/),
            "concreteType": "HomeWorkspaceProductsConnection",
            "kind": "LinkedField",
            "name": "products",
            "plural": false,
            "selections": [
              {
                "alias": null,
                "args": null,
                "concreteType": "HomeWorkspaceProductsEdge",
                "kind": "LinkedField",
                "name": "edges",
                "plural": true,
                "selections": [
                  (v10/*:: as any*/)
                ],
                "storageKey": null
              },
              {
                "args": null,
                "kind": "FragmentSpread",
                "name": "HomeProductLedger_products"
              }
            ],
            "storageKey": null
          }
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
    "name": "HomeRouteQuery",
    "selections": [
      {
        "alias": null,
        "args": (v2/*:: as any*/),
        "concreteType": "HomeWorkspace",
        "kind": "LinkedField",
        "name": "homeWorkspace",
        "plural": false,
        "selections": [
          (v7/*:: as any*/),
          (v9/*:: as any*/),
          {
            "alias": null,
            "args": (v3/*:: as any*/),
            "concreteType": "HomeWorkspaceProductsConnection",
            "kind": "LinkedField",
            "name": "products",
            "plural": false,
            "selections": [
              {
                "alias": null,
                "args": null,
                "concreteType": "HomeWorkspaceProductsEdge",
                "kind": "LinkedField",
                "name": "edges",
                "plural": true,
                "selections": [
                  (v10/*:: as any*/),
                  {
                    "alias": null,
                    "args": null,
                    "concreteType": "Product",
                    "kind": "LinkedField",
                    "name": "node",
                    "plural": false,
                    "selections": (v8/*:: as any*/),
                    "storageKey": null
                  },
                  {
                    "alias": null,
                    "args": null,
                    "concreteType": "HomeSpecificationHighlight",
                    "kind": "LinkedField",
                    "name": "highlights",
                    "plural": true,
                    "selections": [
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
                        "name": "value",
                        "storageKey": null
                      }
                    ],
                    "storageKey": null
                  },
                  {
                    "alias": null,
                    "args": null,
                    "concreteType": "HomeOfferSummary",
                    "kind": "LinkedField",
                    "name": "offer",
                    "plural": false,
                    "selections": [
                      {
                        "alias": null,
                        "args": null,
                        "kind": "ScalarField",
                        "name": "merchantName",
                        "storageKey": null
                      },
                      {
                        "alias": null,
                        "args": null,
                        "kind": "ScalarField",
                        "name": "currency",
                        "storageKey": null
                      },
                      {
                        "alias": null,
                        "args": null,
                        "kind": "ScalarField",
                        "name": "landedPrice",
                        "storageKey": null
                      },
                      {
                        "alias": null,
                        "args": null,
                        "kind": "ScalarField",
                        "name": "priceSignal",
                        "storageKey": null
                      },
                      {
                        "alias": null,
                        "args": null,
                        "kind": "ScalarField",
                        "name": "observedAt",
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
          }
        ],
        "storageKey": null
      }
    ]
  },
  "params": {
    "cacheID": "94dec2b59af5a4b21bedd0076caebf5e",
    "id": null,
    "metadata": {},
    "name": "HomeRouteQuery",
    "operationKind": "query",
    "text": "query HomeRouteQuery(\n  $selectedSlugs: [String!]!\n  $first: Int!\n) {\n  homeWorkspace(selectedSlugs: $selectedSlugs) {\n    categories(first: $first) {\n      edges {\n        node {\n          id\n          name\n          slug\n          description\n        }\n      }\n    }\n    selectedProducts {\n      id\n      name\n      slug\n    }\n    products(first: $first) {\n      edges {\n        cursor\n      }\n      ...HomeProductLedger_products\n    }\n  }\n}\n\nfragment HomeProductLedger_products on HomeWorkspaceProductsConnection {\n  edges {\n    node {\n      id\n      name\n      slug\n    }\n    highlights {\n      label\n      value\n    }\n    offer {\n      merchantName\n      currency\n      landedPrice\n      priceSignal\n      observedAt\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "ef04c22e53a6d3993363c525adb74139";

export default node;

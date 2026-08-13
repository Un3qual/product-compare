/**
 * @generated SignedSource<<cbacb95df9c53b8dd5ab97220a5c9618>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
import { FragmentRefs } from "relay-runtime";
export type CouponDiscountType = "AMOUNT" | "FREE_SHIPPING" | "OTHER" | "PERCENT" | "%future added value";
export type CompareRouteQuery$variables = {
  offerFirst: number;
  slugs: ReadonlyArray<string>;
};
export type CompareRouteQuery$data = {
  readonly comparisonProducts: ReadonlyArray<{
    readonly brand: {
      readonly id: string;
      readonly name: string;
    } | null | undefined;
    readonly currentAttributes: ReadonlyArray<{
      readonly attributeId: string;
      readonly booleanValue: boolean | null | undefined;
      readonly code: string;
      readonly dataType: string;
      readonly displayName: string;
      readonly enumOptionId: string | null | undefined;
      readonly groupLabel: string | null | undefined;
      readonly isRequired: boolean;
      readonly numericValue: string | null | undefined;
      readonly sortOrder: number | null | undefined;
      readonly unitSymbol: string | null | undefined;
      readonly valueText: string;
    }>;
    readonly description: string | null | undefined;
    readonly id: string;
    readonly merchantProducts: {
      readonly edges: ReadonlyArray<{
        readonly node: {
          readonly activeCoupons: {
            readonly edges: ReadonlyArray<{
              readonly node: {
                readonly code: string;
                readonly currency: string | null | undefined;
                readonly discountType: CouponDiscountType;
                readonly discountValue: string | null | undefined;
                readonly validTo: string | null | undefined;
              };
            }>;
            readonly pageInfo: {
              readonly hasNextPage: boolean;
            };
          } | null | undefined;
          readonly currency: string;
          readonly id: string;
          readonly latestPrice: {
            readonly id: string;
            readonly observedAt: string;
            readonly price: string;
          } | null | undefined;
          readonly merchant: {
            readonly domain: string;
            readonly id: string;
            readonly name: string;
          } | null | undefined;
          readonly priceHistory: {
            readonly edges: ReadonlyArray<{
              readonly node: {
                readonly id: string;
                readonly observedAt: string;
                readonly price: string;
              };
            }>;
            readonly pageInfo: {
              readonly hasNextPage: boolean;
            };
          } | null | undefined;
        };
      }>;
      readonly pageInfo: {
        readonly endCursor: string | null | undefined;
        readonly hasNextPage: boolean;
      };
    } | null | undefined;
    readonly name: string;
    readonly slug: string;
    readonly " $fragmentSpreads": FragmentRefs<"CompareProductList_product">;
  } | null | undefined>;
};
export type CompareRouteQuery = {
  response: CompareRouteQuery$data;
  variables: CompareRouteQuery$variables;
};

const node: ConcreteRequest = (function(){
var v0 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "offerFirst"
},
v1 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "slugs"
},
v2 = [
  {
    "kind": "Variable",
    "name": "slugs",
    "variableName": "slugs"
  }
],
v3 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "id",
  "storageKey": null
},
v4 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "name",
  "storageKey": null
},
v5 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "slug",
  "storageKey": null
},
v6 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "description",
  "storageKey": null
},
v7 = {
  "alias": null,
  "args": null,
  "concreteType": "Brand",
  "kind": "LinkedField",
  "name": "brand",
  "plural": false,
  "selections": [
    (v3/*: any*/),
    (v4/*: any*/)
  ],
  "storageKey": null
},
v8 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "code",
  "storageKey": null
},
v9 = {
  "alias": null,
  "args": null,
  "concreteType": "ProductAttributeValue",
  "kind": "LinkedField",
  "name": "currentAttributes",
  "plural": true,
  "selections": [
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "attributeId",
      "storageKey": null
    },
    (v8/*: any*/),
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "displayName",
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "dataType",
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "valueText",
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "sortOrder",
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "groupLabel",
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "isRequired",
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "numericValue",
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "booleanValue",
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "enumOptionId",
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "unitSymbol",
      "storageKey": null
    }
  ],
  "storageKey": null
},
v10 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "currency",
  "storageKey": null
},
v11 = [
  (v3/*: any*/),
  {
    "alias": null,
    "args": null,
    "kind": "ScalarField",
    "name": "price",
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
v12 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "hasNextPage",
  "storageKey": null
},
v13 = {
  "alias": null,
  "args": null,
  "concreteType": "PageInfo",
  "kind": "LinkedField",
  "name": "pageInfo",
  "plural": false,
  "selections": [
    (v12/*: any*/)
  ],
  "storageKey": null
},
v14 = {
  "alias": null,
  "args": [
    {
      "kind": "Literal",
      "name": "activeOnly",
      "value": true
    },
    {
      "kind": "Variable",
      "name": "first",
      "variableName": "offerFirst"
    }
  ],
  "concreteType": "MerchantProductConnection",
  "kind": "LinkedField",
  "name": "merchantProducts",
  "plural": false,
  "selections": [
    {
      "alias": null,
      "args": null,
      "concreteType": "MerchantProductEdge",
      "kind": "LinkedField",
      "name": "edges",
      "plural": true,
      "selections": [
        {
          "alias": null,
          "args": null,
          "concreteType": "MerchantProduct",
          "kind": "LinkedField",
          "name": "node",
          "plural": false,
          "selections": [
            (v3/*: any*/),
            (v10/*: any*/),
            {
              "alias": null,
              "args": null,
              "concreteType": "Merchant",
              "kind": "LinkedField",
              "name": "merchant",
              "plural": false,
              "selections": [
                (v3/*: any*/),
                (v4/*: any*/),
                {
                  "alias": null,
                  "args": null,
                  "kind": "ScalarField",
                  "name": "domain",
                  "storageKey": null
                }
              ],
              "storageKey": null
            },
            {
              "alias": null,
              "args": null,
              "concreteType": "PricePoint",
              "kind": "LinkedField",
              "name": "latestPrice",
              "plural": false,
              "selections": (v11/*: any*/),
              "storageKey": null
            },
            {
              "alias": null,
              "args": [
                {
                  "kind": "Literal",
                  "name": "first",
                  "value": 2
                }
              ],
              "concreteType": "ActiveCouponConnection",
              "kind": "LinkedField",
              "name": "activeCoupons",
              "plural": false,
              "selections": [
                {
                  "alias": null,
                  "args": null,
                  "concreteType": "ActiveCouponEdge",
                  "kind": "LinkedField",
                  "name": "edges",
                  "plural": true,
                  "selections": [
                    {
                      "alias": null,
                      "args": null,
                      "concreteType": "ActiveCoupon",
                      "kind": "LinkedField",
                      "name": "node",
                      "plural": false,
                      "selections": [
                        (v8/*: any*/),
                        {
                          "alias": null,
                          "args": null,
                          "kind": "ScalarField",
                          "name": "discountType",
                          "storageKey": null
                        },
                        {
                          "alias": null,
                          "args": null,
                          "kind": "ScalarField",
                          "name": "discountValue",
                          "storageKey": null
                        },
                        (v10/*: any*/),
                        {
                          "alias": null,
                          "args": null,
                          "kind": "ScalarField",
                          "name": "validTo",
                          "storageKey": null
                        }
                      ],
                      "storageKey": null
                    }
                  ],
                  "storageKey": null
                },
                (v13/*: any*/)
              ],
              "storageKey": "activeCoupons(first:2)"
            },
            {
              "alias": null,
              "args": [
                {
                  "kind": "Literal",
                  "name": "first",
                  "value": 3
                }
              ],
              "concreteType": "PricePointConnection",
              "kind": "LinkedField",
              "name": "priceHistory",
              "plural": false,
              "selections": [
                {
                  "alias": null,
                  "args": null,
                  "concreteType": "PricePointEdge",
                  "kind": "LinkedField",
                  "name": "edges",
                  "plural": true,
                  "selections": [
                    {
                      "alias": null,
                      "args": null,
                      "concreteType": "PricePoint",
                      "kind": "LinkedField",
                      "name": "node",
                      "plural": false,
                      "selections": (v11/*: any*/),
                      "storageKey": null
                    }
                  ],
                  "storageKey": null
                },
                (v13/*: any*/)
              ],
              "storageKey": "priceHistory(first:3)"
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
          "name": "endCursor",
          "storageKey": null
        },
        (v12/*: any*/)
      ],
      "storageKey": null
    }
  ],
  "storageKey": null
};
return {
  "fragment": {
    "argumentDefinitions": [
      (v0/*: any*/),
      (v1/*: any*/)
    ],
    "kind": "Fragment",
    "metadata": null,
    "name": "CompareRouteQuery",
    "selections": [
      {
        "alias": null,
        "args": (v2/*: any*/),
        "concreteType": "Product",
        "kind": "LinkedField",
        "name": "comparisonProducts",
        "plural": true,
        "selections": [
          (v3/*: any*/),
          (v4/*: any*/),
          (v5/*: any*/),
          (v6/*: any*/),
          (v7/*: any*/),
          (v9/*: any*/),
          (v14/*: any*/),
          {
            "args": null,
            "kind": "FragmentSpread",
            "name": "CompareProductList_product"
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
      (v1/*: any*/),
      (v0/*: any*/)
    ],
    "kind": "Operation",
    "name": "CompareRouteQuery",
    "selections": [
      {
        "alias": null,
        "args": (v2/*: any*/),
        "concreteType": "Product",
        "kind": "LinkedField",
        "name": "comparisonProducts",
        "plural": true,
        "selections": [
          (v3/*: any*/),
          (v4/*: any*/),
          (v5/*: any*/),
          (v6/*: any*/),
          (v7/*: any*/),
          (v9/*: any*/),
          (v14/*: any*/)
        ],
        "storageKey": null
      }
    ]
  },
  "params": {
    "cacheID": "187ba9cde8614647b5765f65ac323419",
    "id": null,
    "metadata": {},
    "name": "CompareRouteQuery",
    "operationKind": "query",
    "text": "query CompareRouteQuery(\n  $slugs: [String!]!\n  $offerFirst: Int!\n) {\n  comparisonProducts(slugs: $slugs) {\n    id\n    name\n    slug\n    description\n    brand {\n      id\n      name\n    }\n    currentAttributes {\n      attributeId\n      code\n      displayName\n      dataType\n      valueText\n      sortOrder\n      groupLabel\n      isRequired\n      numericValue\n      booleanValue\n      enumOptionId\n      unitSymbol\n    }\n    merchantProducts(first: $offerFirst, activeOnly: true) {\n      edges {\n        node {\n          id\n          currency\n          merchant {\n            id\n            name\n            domain\n          }\n          latestPrice {\n            id\n            price\n            observedAt\n          }\n          activeCoupons(first: 2) {\n            edges {\n              node {\n                code\n                discountType\n                discountValue\n                currency\n                validTo\n              }\n            }\n            pageInfo {\n              hasNextPage\n            }\n          }\n          priceHistory(first: 3) {\n            edges {\n              node {\n                id\n                price\n                observedAt\n              }\n            }\n            pageInfo {\n              hasNextPage\n            }\n          }\n        }\n      }\n      pageInfo {\n        endCursor\n        hasNextPage\n      }\n    }\n    ...CompareProductList_product\n  }\n}\n\nfragment CompareProductList_product on Product {\n  id\n  name\n  slug\n  description\n  brand {\n    name\n    id\n  }\n  currentAttributes {\n    attributeId\n    code\n    displayName\n    dataType\n    valueText\n    sortOrder\n    groupLabel\n    isRequired\n    numericValue\n    booleanValue\n    enumOptionId\n    unitSymbol\n  }\n}\n"
  }
};
})();

(node as any).hash = "5f0be6344d1ad5fba2096822a904c73f";

export default node;

/**
 * @generated SignedSource<<810119120fb4b6016b72baff33e3fa63>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type CouponDiscountType = "AMOUNT" | "FREE_SHIPPING" | "OTHER" | "PERCENT" | "%future added value";
export type MerchantProductsInput = {
  activeOnly?: boolean | null | undefined;
  merchantId?: string | null | undefined;
  productId: string;
};
export type OfferDiscoveryRouteQuery$variables = {
  after?: string | null | undefined;
  first: number;
  input: MerchantProductsInput;
  productId: string;
};
export type OfferDiscoveryRouteQuery$data = {
  readonly merchantProducts: {
    readonly edges: ReadonlyArray<{
      readonly cursor: string;
      readonly node: {
        readonly activeCoupons: {
          readonly edges: ReadonlyArray<{
            readonly cursor: string;
            readonly node: {
              readonly code: string;
              readonly currency: string | null | undefined;
              readonly description: string | null | undefined;
              readonly discountType: CouponDiscountType;
              readonly discountValue: any | null | undefined;
              readonly terms: string | null | undefined;
              readonly validTo: any | null | undefined;
            };
          }>;
          readonly pageInfo: {
            readonly hasNextPage: boolean;
          };
        } | null | undefined;
        readonly currency: string;
        readonly id: string;
        readonly isActive: boolean;
        readonly lastSeenAt: any | null | undefined;
        readonly latestPrice: {
          readonly id: string;
          readonly observedAt: any;
          readonly price: any;
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
              readonly observedAt: any;
              readonly price: any;
            };
          }>;
          readonly pageInfo: {
            readonly hasNextPage: boolean;
          };
        } | null | undefined;
        readonly product: {
          readonly id: string;
          readonly name: string;
          readonly slug: string;
        } | null | undefined;
        readonly url: string;
      };
    }>;
    readonly pageInfo: {
      readonly endCursor: string | null | undefined;
      readonly hasNextPage: boolean;
      readonly hasPreviousPage: boolean;
    };
  } | null | undefined;
  readonly selectedProduct: {
    readonly __typename: "Product";
    readonly brand: {
      readonly id: string;
      readonly name: string;
    } | null | undefined;
    readonly id: string;
    readonly name: string;
    readonly slug: string;
  } | {
    // This will never be '%other', but we need some
    // value in case none of the concrete values match.
    readonly __typename: "%other";
  } | null | undefined;
};
export type OfferDiscoveryRouteQuery = {
  response: OfferDiscoveryRouteQuery$data;
  variables: OfferDiscoveryRouteQuery$variables;
};

const node: ConcreteRequest = (function(){
var v0 = [
  {
    "defaultValue": null,
    "kind": "LocalArgument",
    "name": "after"
  },
  {
    "defaultValue": null,
    "kind": "LocalArgument",
    "name": "first"
  },
  {
    "defaultValue": null,
    "kind": "LocalArgument",
    "name": "input"
  },
  {
    "defaultValue": null,
    "kind": "LocalArgument",
    "name": "productId"
  }
],
v1 = [
  {
    "kind": "Variable",
    "name": "id",
    "variableName": "productId"
  }
],
v2 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "__typename",
  "storageKey": null
},
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
v7 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "cursor",
  "storageKey": null
},
v8 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "currency",
  "storageKey": null
},
v9 = [
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
v10 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "hasNextPage",
  "storageKey": null
},
v11 = {
  "alias": null,
  "args": null,
  "concreteType": "PageInfo",
  "kind": "LinkedField",
  "name": "pageInfo",
  "plural": false,
  "selections": [
    (v10/*: any*/)
  ],
  "storageKey": null
},
v12 = {
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
      "name": "input",
      "variableName": "input"
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
        (v7/*: any*/),
        {
          "alias": null,
          "args": null,
          "concreteType": "MerchantProduct",
          "kind": "LinkedField",
          "name": "node",
          "plural": false,
          "selections": [
            (v3/*: any*/),
            {
              "alias": null,
              "args": null,
              "kind": "ScalarField",
              "name": "url",
              "storageKey": null
            },
            (v8/*: any*/),
            {
              "alias": null,
              "args": null,
              "kind": "ScalarField",
              "name": "lastSeenAt",
              "storageKey": null
            },
            {
              "alias": null,
              "args": null,
              "kind": "ScalarField",
              "name": "isActive",
              "storageKey": null
            },
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
              "concreteType": "Product",
              "kind": "LinkedField",
              "name": "product",
              "plural": false,
              "selections": [
                (v3/*: any*/),
                (v4/*: any*/),
                (v5/*: any*/)
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
              "selections": (v9/*: any*/),
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
                    (v7/*: any*/),
                    {
                      "alias": null,
                      "args": null,
                      "concreteType": "ActiveCoupon",
                      "kind": "LinkedField",
                      "name": "node",
                      "plural": false,
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
                          "name": "description",
                          "storageKey": null
                        },
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
                        (v8/*: any*/),
                        {
                          "alias": null,
                          "args": null,
                          "kind": "ScalarField",
                          "name": "validTo",
                          "storageKey": null
                        },
                        {
                          "alias": null,
                          "args": null,
                          "kind": "ScalarField",
                          "name": "terms",
                          "storageKey": null
                        }
                      ],
                      "storageKey": null
                    }
                  ],
                  "storageKey": null
                },
                (v11/*: any*/)
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
                      "selections": (v9/*: any*/),
                      "storageKey": null
                    }
                  ],
                  "storageKey": null
                },
                (v11/*: any*/)
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
        (v10/*: any*/),
        {
          "alias": null,
          "args": null,
          "kind": "ScalarField",
          "name": "hasPreviousPage",
          "storageKey": null
        }
      ],
      "storageKey": null
    }
  ],
  "storageKey": null
};
return {
  "fragment": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Fragment",
    "metadata": null,
    "name": "OfferDiscoveryRouteQuery",
    "selections": [
      {
        "alias": "selectedProduct",
        "args": (v1/*: any*/),
        "concreteType": null,
        "kind": "LinkedField",
        "name": "node",
        "plural": false,
        "selections": [
          (v2/*: any*/),
          {
            "kind": "InlineFragment",
            "selections": [
              (v3/*: any*/),
              (v4/*: any*/),
              (v5/*: any*/),
              (v6/*: any*/)
            ],
            "type": "Product",
            "abstractKey": null
          }
        ],
        "storageKey": null
      },
      (v12/*: any*/)
    ],
    "type": "RootQueryType",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "OfferDiscoveryRouteQuery",
    "selections": [
      {
        "alias": "selectedProduct",
        "args": (v1/*: any*/),
        "concreteType": null,
        "kind": "LinkedField",
        "name": "node",
        "plural": false,
        "selections": [
          (v2/*: any*/),
          (v3/*: any*/),
          {
            "kind": "InlineFragment",
            "selections": [
              (v4/*: any*/),
              (v5/*: any*/),
              (v6/*: any*/)
            ],
            "type": "Product",
            "abstractKey": null
          }
        ],
        "storageKey": null
      },
      (v12/*: any*/)
    ]
  },
  "params": {
    "cacheID": "db5de44c225f8c4c70e90bcee04e9c7a",
    "id": null,
    "metadata": {},
    "name": "OfferDiscoveryRouteQuery",
    "operationKind": "query",
    "text": "query OfferDiscoveryRouteQuery(\n  $after: String\n  $first: Int!\n  $input: MerchantProductsInput!\n  $productId: ID!\n) {\n  selectedProduct: node(id: $productId) {\n    __typename\n    ... on Product {\n      id\n      name\n      slug\n      brand {\n        id\n        name\n      }\n    }\n    id\n  }\n  merchantProducts(after: $after, first: $first, input: $input) {\n    edges {\n      cursor\n      node {\n        id\n        url\n        currency\n        lastSeenAt\n        isActive\n        merchant {\n          id\n          name\n          domain\n        }\n        product {\n          id\n          name\n          slug\n        }\n        latestPrice {\n          id\n          price\n          observedAt\n        }\n        activeCoupons(first: 2) {\n          edges {\n            cursor\n            node {\n              code\n              description\n              discountType\n              discountValue\n              currency\n              validTo\n              terms\n            }\n          }\n          pageInfo {\n            hasNextPage\n          }\n        }\n        priceHistory(first: 3) {\n          edges {\n            node {\n              id\n              price\n              observedAt\n            }\n          }\n          pageInfo {\n            hasNextPage\n          }\n        }\n      }\n    }\n    pageInfo {\n      endCursor\n      hasNextPage\n      hasPreviousPage\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "c4f2d78cc5d761f637f7fe8fc5e37505";

export default node;

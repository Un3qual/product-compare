/**
 * @generated SignedSource<<cd1ee9b5a0d8ae3dc7d516ee20d75532>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type CouponDiscountType = "AMOUNT" | "FREE_SHIPPING" | "OTHER" | "PERCENT" | "%future added value";
export type ProductOffersRouteQuery$variables = {
  after?: string | null | undefined;
  first: number;
  productId: string;
};
export type ProductOffersRouteQuery$data = {
  readonly merchantProducts: {
    readonly edges: ReadonlyArray<{
      readonly cursor: string;
      readonly node: {
        readonly activeCoupons: {
          readonly edges: ReadonlyArray<{
            readonly node: {
              readonly code: string;
              readonly currency: string | null | undefined;
              readonly description: string | null | undefined;
              readonly discountType: CouponDiscountType;
              readonly discountValue: any | null | undefined;
              readonly id: string;
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
        readonly latestPrice: {
          readonly id: string;
          readonly price: any;
        } | null | undefined;
        readonly merchant: {
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
        readonly url: string;
      };
    }>;
    readonly pageInfo: {
      readonly endCursor: string | null | undefined;
      readonly hasNextPage: boolean;
    };
  };
};
export type ProductOffersRouteQuery = {
  response: ProductOffersRouteQuery$data;
  variables: ProductOffersRouteQuery$variables;
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
  "name": "productId"
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
  "name": "currency",
  "storageKey": null
},
v5 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "price",
  "storageKey": null
},
v6 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "hasNextPage",
  "storageKey": null
},
v7 = {
  "alias": null,
  "args": null,
  "concreteType": "PageInfo",
  "kind": "LinkedField",
  "name": "pageInfo",
  "plural": false,
  "selections": [
    (v6/*: any*/)
  ],
  "storageKey": null
},
v8 = [
  {
    "alias": null,
    "args": [
      {
        "fields": [
          {
            "kind": "Literal",
            "name": "activeOnly",
            "value": true
          },
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
            "name": "productId",
            "variableName": "productId"
          }
        ],
        "kind": "ObjectValue",
        "name": "input"
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
            "kind": "ScalarField",
            "name": "cursor",
            "storageKey": null
          },
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
              (v4/*: any*/),
              {
                "alias": null,
                "args": null,
                "concreteType": "Merchant",
                "kind": "LinkedField",
                "name": "merchant",
                "plural": false,
                "selections": [
                  (v3/*: any*/),
                  {
                    "alias": null,
                    "args": null,
                    "kind": "ScalarField",
                    "name": "name",
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
                "selections": [
                  (v3/*: any*/),
                  (v5/*: any*/)
                ],
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
                          (v3/*: any*/),
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
                          (v4/*: any*/),
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
                  (v7/*: any*/)
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
                        "selections": [
                          (v3/*: any*/),
                          (v5/*: any*/),
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
                  },
                  (v7/*: any*/)
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
          (v6/*: any*/)
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
    "name": "ProductOffersRouteQuery",
    "selections": (v8/*: any*/),
    "type": "Query",
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
    "name": "ProductOffersRouteQuery",
    "selections": (v8/*: any*/)
  },
  "params": {
    "cacheID": "eb6f99086aa8e10c5808eb4ae8528249",
    "id": null,
    "metadata": {},
    "name": "ProductOffersRouteQuery",
    "operationKind": "query",
    "text": "query ProductOffersRouteQuery(\n  $productId: ID!\n  $first: Int!\n  $after: String\n) {\n  merchantProducts(input: {productId: $productId, activeOnly: true, first: $first, after: $after}) {\n    edges {\n      cursor\n      node {\n        id\n        url\n        currency\n        merchant {\n          id\n          name\n        }\n        latestPrice {\n          id\n          price\n        }\n        activeCoupons(first: 2) {\n          edges {\n            node {\n              id\n              code\n              description\n              discountType\n              discountValue\n              currency\n              validTo\n              terms\n            }\n          }\n          pageInfo {\n            hasNextPage\n          }\n        }\n        priceHistory(first: 3) {\n          edges {\n            node {\n              id\n              price\n              observedAt\n            }\n          }\n          pageInfo {\n            hasNextPage\n          }\n        }\n      }\n    }\n    pageInfo {\n      endCursor\n      hasNextPage\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "301d0eef53bd6ee4d66c9e93f3945af2";

export default node;

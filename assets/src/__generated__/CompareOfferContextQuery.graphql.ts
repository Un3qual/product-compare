/**
 * @generated SignedSource<<7e542a5799bc6149be7e00770a1bfe12>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type CouponDiscountType = "AMOUNT" | "FREE_SHIPPING" | "OTHER" | "PERCENT" | "%future added value";
export type CompareOfferContextQuery$variables = {
  after?: string | null | undefined;
  first: number;
  productId: string;
};
export type CompareOfferContextQuery$data = {
  readonly merchantProducts: {
    readonly edges: ReadonlyArray<{
      readonly node: {
        readonly activeCoupons: {
          readonly edges: ReadonlyArray<{
            readonly node: {
              readonly code: string;
              readonly currency: string | null | undefined;
              readonly discountType: CouponDiscountType;
              readonly discountValue: any | null | undefined;
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
      };
    }>;
    readonly pageInfo: {
      readonly endCursor: string | null | undefined;
      readonly hasNextPage: boolean;
    };
  };
};
export type CompareOfferContextQuery = {
  response: CompareOfferContextQuery$data;
  variables: CompareOfferContextQuery$variables;
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
v5 = [
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
            "concreteType": "MerchantProduct",
            "kind": "LinkedField",
            "name": "node",
            "plural": false,
            "selections": [
              (v3/*: any*/),
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
                  },
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
                "selections": (v5/*: any*/),
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
                        "selections": (v5/*: any*/),
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
    "name": "CompareOfferContextQuery",
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
    "name": "CompareOfferContextQuery",
    "selections": (v8/*: any*/)
  },
  "params": {
    "cacheID": "4d65c8045f7b2299629d48e2620975ad",
    "id": null,
    "metadata": {},
    "name": "CompareOfferContextQuery",
    "operationKind": "query",
    "text": "query CompareOfferContextQuery(\n  $productId: ID!\n  $first: Int!\n  $after: String\n) {\n  merchantProducts(input: {productId: $productId, activeOnly: true, first: $first, after: $after}) {\n    edges {\n      node {\n        id\n        currency\n        merchant {\n          id\n          name\n          domain\n        }\n        latestPrice {\n          id\n          price\n          observedAt\n        }\n        activeCoupons(first: 2) {\n          edges {\n            node {\n              code\n              discountType\n              discountValue\n              currency\n              validTo\n            }\n          }\n          pageInfo {\n            hasNextPage\n          }\n        }\n        priceHistory(first: 3) {\n          edges {\n            node {\n              id\n              price\n              observedAt\n            }\n          }\n          pageInfo {\n            hasNextPage\n          }\n        }\n      }\n    }\n    pageInfo {\n      endCursor\n      hasNextPage\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "846d39ec590a38037f4b740dd14e13a4";

export default node;

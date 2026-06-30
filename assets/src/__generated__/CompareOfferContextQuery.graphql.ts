/**
 * @generated SignedSource<<7b1845de551ff679843ad9caa67a2b8a>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type CouponDiscountType = "AMOUNT" | "FREE_SHIPPING" | "OTHER" | "PERCENT" | "%future added value";
export type CompareOfferContextQuery$variables = {
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
  "name": "first"
},
v1 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "productId"
},
v2 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "id",
  "storageKey": null
},
v3 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "currency",
  "storageKey": null
},
v4 = [
  (v2/*: any*/),
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
v5 = {
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
    }
  ],
  "storageKey": null
},
v6 = [
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
              (v2/*: any*/),
              (v3/*: any*/),
              {
                "alias": null,
                "args": null,
                "concreteType": "Merchant",
                "kind": "LinkedField",
                "name": "merchant",
                "plural": false,
                "selections": [
                  (v2/*: any*/),
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
                "selections": (v4/*: any*/),
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
                          (v3/*: any*/),
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
                  (v5/*: any*/)
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
                        "selections": (v4/*: any*/),
                        "storageKey": null
                      }
                    ],
                    "storageKey": null
                  },
                  (v5/*: any*/)
                ],
                "storageKey": "priceHistory(first:3)"
              }
            ],
            "storageKey": null
          }
        ],
        "storageKey": null
      },
      (v5/*: any*/)
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
    "name": "CompareOfferContextQuery",
    "selections": (v6/*: any*/),
    "type": "Query",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": [
      (v1/*: any*/),
      (v0/*: any*/)
    ],
    "kind": "Operation",
    "name": "CompareOfferContextQuery",
    "selections": (v6/*: any*/)
  },
  "params": {
    "cacheID": "4b2d1b1a6adfd7849422173a9e512874",
    "id": null,
    "metadata": {},
    "name": "CompareOfferContextQuery",
    "operationKind": "query",
    "text": "query CompareOfferContextQuery(\n  $productId: ID!\n  $first: Int!\n) {\n  merchantProducts(input: {productId: $productId, activeOnly: true, first: $first}) {\n    edges {\n      node {\n        id\n        currency\n        merchant {\n          id\n          name\n          domain\n        }\n        latestPrice {\n          id\n          price\n          observedAt\n        }\n        activeCoupons(first: 2) {\n          edges {\n            node {\n              code\n              discountType\n              discountValue\n              currency\n              validTo\n            }\n          }\n          pageInfo {\n            hasNextPage\n          }\n        }\n        priceHistory(first: 3) {\n          edges {\n            node {\n              id\n              price\n              observedAt\n            }\n          }\n          pageInfo {\n            hasNextPage\n          }\n        }\n      }\n    }\n    pageInfo {\n      hasNextPage\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "1f4bc6f5c7248b2a0b8677183fa240bd";

export default node;

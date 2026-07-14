/**
 * @generated SignedSource<<351724ab0391273e35112934d82eca2d>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type CouponDiscountType = "AMOUNT" | "FREE_SHIPPING" | "OTHER" | "PERCENT" | "%future added value";
export type ProductDetailRouteQuery$variables = {
  offerFirst: number;
  offersAfter?: string | null | undefined;
  slug: string;
};
export type ProductDetailRouteQuery$data = {
  readonly product: {
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
      readonly numericValue: any | null | undefined;
      readonly sortOrder: number | null | undefined;
      readonly unitSymbol: string | null | undefined;
      readonly valueText: string;
    }>;
    readonly description: string | null | undefined;
    readonly id: string;
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
          readonly latestPrice: {
            readonly id: string;
            readonly observedAt: any;
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
    } | null | undefined;
    readonly name: string;
    readonly slug: string;
  } | null | undefined;
};
export type ProductDetailRouteQuery = {
  response: ProductDetailRouteQuery$data;
  variables: ProductDetailRouteQuery$variables;
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
  "name": "offersAfter"
},
v2 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "slug"
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
  "name": "description",
  "storageKey": null
},
v6 = [
  (v3/*: any*/),
  (v4/*: any*/)
],
v7 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "code",
  "storageKey": null
},
v8 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "cursor",
  "storageKey": null
},
v9 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "currency",
  "storageKey": null
},
v10 = [
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
v11 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "hasNextPage",
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
    (v11/*: any*/)
  ],
  "storageKey": null
},
v13 = [
  {
    "alias": null,
    "args": [
      {
        "kind": "Variable",
        "name": "slug",
        "variableName": "slug"
      }
    ],
    "concreteType": "Product",
    "kind": "LinkedField",
    "name": "product",
    "plural": false,
    "selections": [
      (v3/*: any*/),
      (v4/*: any*/),
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "slug",
        "storageKey": null
      },
      (v5/*: any*/),
      {
        "alias": null,
        "args": null,
        "concreteType": "Brand",
        "kind": "LinkedField",
        "name": "brand",
        "plural": false,
        "selections": (v6/*: any*/),
        "storageKey": null
      },
      {
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
          (v7/*: any*/),
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
      {
        "alias": null,
        "args": [
          {
            "kind": "Literal",
            "name": "activeOnly",
            "value": true
          },
          {
            "kind": "Variable",
            "name": "after",
            "variableName": "offersAfter"
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
              (v8/*: any*/),
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
                  (v9/*: any*/),
                  {
                    "alias": null,
                    "args": null,
                    "concreteType": "Merchant",
                    "kind": "LinkedField",
                    "name": "merchant",
                    "plural": false,
                    "selections": (v6/*: any*/),
                    "storageKey": null
                  },
                  {
                    "alias": null,
                    "args": null,
                    "concreteType": "PricePoint",
                    "kind": "LinkedField",
                    "name": "latestPrice",
                    "plural": false,
                    "selections": (v10/*: any*/),
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
                          (v8/*: any*/),
                          {
                            "alias": null,
                            "args": null,
                            "concreteType": "ActiveCoupon",
                            "kind": "LinkedField",
                            "name": "node",
                            "plural": false,
                            "selections": [
                              (v7/*: any*/),
                              (v5/*: any*/),
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
                              (v9/*: any*/),
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
                      (v12/*: any*/)
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
                            "selections": (v10/*: any*/),
                            "storageKey": null
                          }
                        ],
                        "storageKey": null
                      },
                      (v12/*: any*/)
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
              (v11/*: any*/)
            ],
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
    "name": "ProductDetailRouteQuery",
    "selections": (v13/*: any*/),
    "type": "RootQueryType",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": [
      (v2/*: any*/),
      (v0/*: any*/),
      (v1/*: any*/)
    ],
    "kind": "Operation",
    "name": "ProductDetailRouteQuery",
    "selections": (v13/*: any*/)
  },
  "params": {
    "cacheID": "700e83eed1be4ad4b6106b19505af46a",
    "id": null,
    "metadata": {},
    "name": "ProductDetailRouteQuery",
    "operationKind": "query",
    "text": "query ProductDetailRouteQuery(\n  $slug: String!\n  $offerFirst: Int!\n  $offersAfter: String\n) {\n  product(slug: $slug) {\n    id\n    name\n    slug\n    description\n    brand {\n      id\n      name\n    }\n    currentAttributes {\n      attributeId\n      code\n      displayName\n      dataType\n      valueText\n      sortOrder\n      groupLabel\n      isRequired\n      numericValue\n      booleanValue\n      enumOptionId\n      unitSymbol\n    }\n    merchantProducts(first: $offerFirst, after: $offersAfter, activeOnly: true) {\n      edges {\n        cursor\n        node {\n          id\n          url\n          currency\n          merchant {\n            id\n            name\n          }\n          latestPrice {\n            id\n            price\n            observedAt\n          }\n          activeCoupons(first: 2) {\n            edges {\n              cursor\n              node {\n                code\n                description\n                discountType\n                discountValue\n                currency\n                validTo\n                terms\n              }\n            }\n            pageInfo {\n              hasNextPage\n            }\n          }\n          priceHistory(first: 3) {\n            edges {\n              node {\n                id\n                price\n                observedAt\n              }\n            }\n            pageInfo {\n              hasNextPage\n            }\n          }\n        }\n      }\n      pageInfo {\n        endCursor\n        hasNextPage\n      }\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "44d357e409cb6a0535beaefd517dbf57";

export default node;

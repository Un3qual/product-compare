/**
 * @generated SignedSource<<eac455b2f13803e4629125625ac9c391>>
 * @lightSyntaxTransform
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
import { FragmentRefs } from "relay-runtime";
export type OfferFreshness = "AGING" | "FRESH" | "STALE" | "UNOBSERVED" | "%future added value";
export type ProductDetailRouteQuery$variables = {
  offerFirst: number;
  offersAfter?: string | null;
  slug: string;
};
export type ProductDetailRouteQuery$data = {
  readonly product: {
    readonly brand: {
      readonly id: string;
      readonly name: string;
    } | null;
    readonly currentAttributes: ReadonlyArray<{
      readonly attributeId: string;
      readonly booleanValue: boolean | null;
      readonly code: string;
      readonly dataType: string;
      readonly displayName: string;
      readonly enumOptionId: string | null;
      readonly groupLabel: string | null;
      readonly isRequired: boolean;
      readonly numericValue: string | null;
      readonly sortOrder: number | null;
      readonly unitSymbol: string | null;
      readonly valueText: string;
    }>;
    readonly description: string | null;
    readonly id: string;
    readonly merchantProducts: {
      readonly edges: ReadonlyArray<{
        readonly cursor: string;
      }>;
      readonly pageInfo: {
        readonly endCursor: string | null;
        readonly hasNextPage: boolean;
      };
      readonly " $fragmentSpreads": FragmentRefs<"ProductOfferPanel_connection">;
    } | null;
    readonly modelNumber: string | null;
    readonly name: string;
    readonly offerTruth: {
      readonly asOf: string;
      readonly currencySummaries: ReadonlyArray<{
        readonly bestOffer: {
          readonly eligible: boolean;
          readonly freshness: OfferFreshness;
          readonly landedPrice: string | null;
          readonly merchantProductId: string;
          readonly observedAt: string | null;
        } | null;
        readonly currency: string;
        readonly eligibleOfferCount: number;
      }>;
      readonly eligibleOfferCount: number;
      readonly observedOfferCount: number;
      readonly offerCount: number;
    };
    readonly priceHistory90d: ReadonlyArray<{
      readonly currency: string;
      readonly merchants: ReadonlyArray<{
        readonly id: string;
        readonly merchantProductId: string;
        readonly name: string;
      }>;
      readonly points: ReadonlyArray<{
        readonly averagePrice: string;
        readonly lowestMerchantProductId: string;
        readonly lowestPrice: string;
        readonly merchantPrices: ReadonlyArray<{
          readonly merchantProductId: string;
          readonly price: string;
        }>;
        readonly observedAt: string;
      }>;
    }>;
    readonly seo: {
      readonly canonicalPath: string;
      readonly description: string;
      readonly imageUrl: string | null;
      readonly indexable: boolean;
      readonly structuredData: string | null;
      readonly title: string;
    };
    readonly slug: string;
  } | null;
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
v3 = [
  {
    "kind": "Variable",
    "name": "slug",
    "variableName": "slug"
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
  "args": null,
  "kind": "ScalarField",
  "name": "modelNumber",
  "storageKey": null
},
v8 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "description",
  "storageKey": null
},
v9 = {
  "alias": null,
  "args": null,
  "concreteType": "SeoMetadata",
  "kind": "LinkedField",
  "name": "seo",
  "plural": false,
  "selections": [
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "title",
      "storageKey": null
    },
    (v8/*:: as any*/),
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "canonicalPath",
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "indexable",
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "imageUrl",
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "structuredData",
      "storageKey": null
    }
  ],
  "storageKey": null
},
v10 = [
  (v4/*:: as any*/),
  (v5/*:: as any*/)
],
v11 = {
  "alias": null,
  "args": null,
  "concreteType": "Brand",
  "kind": "LinkedField",
  "name": "brand",
  "plural": false,
  "selections": (v10/*:: as any*/),
  "storageKey": null
},
v12 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "code",
  "storageKey": null
},
v13 = {
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
    (v12/*:: as any*/),
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
v14 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "eligibleOfferCount",
  "storageKey": null
},
v15 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "currency",
  "storageKey": null
},
v16 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "merchantProductId",
  "storageKey": null
},
v17 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "observedAt",
  "storageKey": null
},
v18 = {
  "alias": null,
  "args": null,
  "concreteType": "ProductOfferTruth",
  "kind": "LinkedField",
  "name": "offerTruth",
  "plural": false,
  "selections": [
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "asOf",
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "offerCount",
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "observedOfferCount",
      "storageKey": null
    },
    (v14/*:: as any*/),
    {
      "alias": null,
      "args": null,
      "concreteType": "OfferCurrencySummary",
      "kind": "LinkedField",
      "name": "currencySummaries",
      "plural": true,
      "selections": [
        (v15/*:: as any*/),
        (v14/*:: as any*/),
        {
          "alias": null,
          "args": null,
          "concreteType": "CurrentOffer",
          "kind": "LinkedField",
          "name": "bestOffer",
          "plural": false,
          "selections": [
            (v16/*:: as any*/),
            {
              "alias": null,
              "args": null,
              "kind": "ScalarField",
              "name": "landedPrice",
              "storageKey": null
            },
            (v17/*:: as any*/),
            {
              "alias": null,
              "args": null,
              "kind": "ScalarField",
              "name": "freshness",
              "storageKey": null
            },
            {
              "alias": null,
              "args": null,
              "kind": "ScalarField",
              "name": "eligible",
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
v19 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "price",
  "storageKey": null
},
v20 = {
  "alias": null,
  "args": null,
  "concreteType": "ProductPriceTrendCurrency",
  "kind": "LinkedField",
  "name": "priceHistory90d",
  "plural": true,
  "selections": [
    (v15/*:: as any*/),
    {
      "alias": null,
      "args": null,
      "concreteType": "ProductPriceTrendMerchant",
      "kind": "LinkedField",
      "name": "merchants",
      "plural": true,
      "selections": [
        (v4/*:: as any*/),
        (v5/*:: as any*/),
        (v16/*:: as any*/)
      ],
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "concreteType": "ProductPriceTrendPoint",
      "kind": "LinkedField",
      "name": "points",
      "plural": true,
      "selections": [
        (v17/*:: as any*/),
        {
          "alias": null,
          "args": null,
          "kind": "ScalarField",
          "name": "lowestPrice",
          "storageKey": null
        },
        {
          "alias": null,
          "args": null,
          "kind": "ScalarField",
          "name": "averagePrice",
          "storageKey": null
        },
        {
          "alias": null,
          "args": null,
          "kind": "ScalarField",
          "name": "lowestMerchantProductId",
          "storageKey": null
        },
        {
          "alias": null,
          "args": null,
          "concreteType": "ProductPriceTrendMerchantPrice",
          "kind": "LinkedField",
          "name": "merchantPrices",
          "plural": true,
          "selections": [
            (v16/*:: as any*/),
            (v19/*:: as any*/)
          ],
          "storageKey": null
        }
      ],
      "storageKey": null
    }
  ],
  "storageKey": null
},
v21 = [
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
v22 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "cursor",
  "storageKey": null
},
v23 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "hasNextPage",
  "storageKey": null
},
v24 = {
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
    (v23/*:: as any*/)
  ],
  "storageKey": null
},
v25 = [
  (v4/*:: as any*/),
  (v19/*:: as any*/),
  (v17/*:: as any*/)
],
v26 = {
  "alias": null,
  "args": null,
  "concreteType": "PageInfo",
  "kind": "LinkedField",
  "name": "pageInfo",
  "plural": false,
  "selections": [
    (v23/*:: as any*/)
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
    "name": "ProductDetailRouteQuery",
    "selections": [
      {
        "alias": null,
        "args": (v3/*:: as any*/),
        "concreteType": "Product",
        "kind": "LinkedField",
        "name": "product",
        "plural": false,
        "selections": [
          (v4/*:: as any*/),
          (v5/*:: as any*/),
          (v6/*:: as any*/),
          (v7/*:: as any*/),
          (v8/*:: as any*/),
          (v9/*:: as any*/),
          (v11/*:: as any*/),
          (v13/*:: as any*/),
          (v18/*:: as any*/),
          (v20/*:: as any*/),
          {
            "alias": null,
            "args": (v21/*:: as any*/),
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
                  (v22/*:: as any*/)
                ],
                "storageKey": null
              },
              (v24/*:: as any*/),
              {
                "args": null,
                "kind": "FragmentSpread",
                "name": "ProductOfferPanel_connection"
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
      (v2/*:: as any*/),
      (v0/*:: as any*/),
      (v1/*:: as any*/)
    ],
    "kind": "Operation",
    "name": "ProductDetailRouteQuery",
    "selections": [
      {
        "alias": null,
        "args": (v3/*:: as any*/),
        "concreteType": "Product",
        "kind": "LinkedField",
        "name": "product",
        "plural": false,
        "selections": [
          (v4/*:: as any*/),
          (v5/*:: as any*/),
          (v6/*:: as any*/),
          (v7/*:: as any*/),
          (v8/*:: as any*/),
          (v9/*:: as any*/),
          (v11/*:: as any*/),
          (v13/*:: as any*/),
          (v18/*:: as any*/),
          (v20/*:: as any*/),
          {
            "alias": null,
            "args": (v21/*:: as any*/),
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
                  (v22/*:: as any*/),
                  {
                    "alias": null,
                    "args": null,
                    "concreteType": "MerchantProduct",
                    "kind": "LinkedField",
                    "name": "node",
                    "plural": false,
                    "selections": [
                      (v4/*:: as any*/),
                      {
                        "alias": null,
                        "args": null,
                        "kind": "ScalarField",
                        "name": "url",
                        "storageKey": null
                      },
                      (v15/*:: as any*/),
                      {
                        "alias": null,
                        "args": null,
                        "concreteType": "Merchant",
                        "kind": "LinkedField",
                        "name": "merchant",
                        "plural": false,
                        "selections": (v10/*:: as any*/),
                        "storageKey": null
                      },
                      {
                        "alias": null,
                        "args": null,
                        "concreteType": "PricePoint",
                        "kind": "LinkedField",
                        "name": "latestPrice",
                        "plural": false,
                        "selections": (v25/*:: as any*/),
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
                              (v22/*:: as any*/),
                              {
                                "alias": null,
                                "args": null,
                                "concreteType": "ActiveCoupon",
                                "kind": "LinkedField",
                                "name": "node",
                                "plural": false,
                                "selections": [
                                  (v12/*:: as any*/),
                                  (v8/*:: as any*/),
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
                                  (v15/*:: as any*/),
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
                          (v26/*:: as any*/)
                        ],
                        "storageKey": "activeCoupons(first:2)"
                      },
                      {
                        "alias": null,
                        "args": [
                          {
                            "kind": "Literal",
                            "name": "first",
                            "value": 12
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
                                "selections": (v25/*:: as any*/),
                                "storageKey": null
                              }
                            ],
                            "storageKey": null
                          },
                          (v26/*:: as any*/)
                        ],
                        "storageKey": "priceHistory(first:12)"
                      }
                    ],
                    "storageKey": null
                  }
                ],
                "storageKey": null
              },
              (v24/*:: as any*/)
            ],
            "storageKey": null
          }
        ],
        "storageKey": null
      }
    ]
  },
  "params": {
    "cacheID": "d71c393d3757c8b12edd059ef07753ee",
    "id": null,
    "metadata": {},
    "name": "ProductDetailRouteQuery",
    "operationKind": "query",
    "text": "query ProductDetailRouteQuery(\n  $slug: String!\n  $offerFirst: Int!\n  $offersAfter: String\n) {\n  product(slug: $slug) {\n    id\n    name\n    slug\n    modelNumber\n    description\n    seo {\n      title\n      description\n      canonicalPath\n      indexable\n      imageUrl\n      structuredData\n    }\n    brand {\n      id\n      name\n    }\n    currentAttributes {\n      attributeId\n      code\n      displayName\n      dataType\n      valueText\n      sortOrder\n      groupLabel\n      isRequired\n      numericValue\n      booleanValue\n      enumOptionId\n      unitSymbol\n    }\n    offerTruth {\n      asOf\n      offerCount\n      observedOfferCount\n      eligibleOfferCount\n      currencySummaries {\n        currency\n        eligibleOfferCount\n        bestOffer {\n          merchantProductId\n          landedPrice\n          observedAt\n          freshness\n          eligible\n        }\n      }\n    }\n    priceHistory90d {\n      currency\n      merchants {\n        id\n        name\n        merchantProductId\n      }\n      points {\n        observedAt\n        lowestPrice\n        averagePrice\n        lowestMerchantProductId\n        merchantPrices {\n          merchantProductId\n          price\n        }\n      }\n    }\n    merchantProducts(first: $offerFirst, after: $offersAfter, activeOnly: true) {\n      edges {\n        cursor\n      }\n      pageInfo {\n        endCursor\n        hasNextPage\n      }\n      ...ProductOfferPanel_connection\n    }\n  }\n}\n\nfragment ProductOfferPanel_connection on MerchantProductConnection {\n  edges {\n    node {\n      id\n      url\n      currency\n      merchant {\n        id\n        name\n      }\n      latestPrice {\n        id\n        price\n        observedAt\n      }\n      activeCoupons(first: 2) {\n        edges {\n          cursor\n          node {\n            code\n            description\n            discountType\n            discountValue\n            currency\n            validTo\n            terms\n          }\n        }\n        pageInfo {\n          hasNextPage\n        }\n      }\n      priceHistory(first: 12) {\n        edges {\n          node {\n            id\n            price\n            observedAt\n          }\n        }\n        pageInfo {\n          hasNextPage\n        }\n      }\n    }\n  }\n  pageInfo {\n    endCursor\n    hasNextPage\n  }\n}\n"
  }
};
})();

(node as any).hash = "d9ab7aeea5977bf4abdcc005bb52ef1f";

export default node;

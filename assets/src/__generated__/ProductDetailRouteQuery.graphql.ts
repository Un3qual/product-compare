/**
 * @generated SignedSource<<493f30638ca13eed843c4b5a81c7190e>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
import { FragmentRefs } from "relay-runtime";
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
      }>;
      readonly pageInfo: {
        readonly endCursor: string | null | undefined;
        readonly hasNextPage: boolean;
      };
      readonly " $fragmentSpreads": FragmentRefs<"ProductOfferPanel_connection">;
    } | null | undefined;
    readonly name: string;
    readonly seo: {
      readonly canonicalPath: string;
      readonly description: string;
      readonly imageUrl: string | null | undefined;
      readonly indexable: boolean;
      readonly structuredData: string | null | undefined;
      readonly title: string;
    };
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
  "name": "description",
  "storageKey": null
},
v8 = {
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
    (v7/*: any*/),
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
v9 = [
  (v4/*: any*/),
  (v5/*: any*/)
],
v10 = {
  "alias": null,
  "args": null,
  "concreteType": "Brand",
  "kind": "LinkedField",
  "name": "brand",
  "plural": false,
  "selections": (v9/*: any*/),
  "storageKey": null
},
v11 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "code",
  "storageKey": null
},
v12 = {
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
    (v11/*: any*/),
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
v13 = [
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
v14 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "cursor",
  "storageKey": null
},
v15 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "hasNextPage",
  "storageKey": null
},
v16 = {
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
    (v15/*: any*/)
  ],
  "storageKey": null
},
v17 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "currency",
  "storageKey": null
},
v18 = [
  (v4/*: any*/),
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
v19 = {
  "alias": null,
  "args": null,
  "concreteType": "PageInfo",
  "kind": "LinkedField",
  "name": "pageInfo",
  "plural": false,
  "selections": [
    (v15/*: any*/)
  ],
  "storageKey": null
};
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
    "selections": [
      {
        "alias": null,
        "args": (v3/*: any*/),
        "concreteType": "Product",
        "kind": "LinkedField",
        "name": "product",
        "plural": false,
        "selections": [
          (v4/*: any*/),
          (v5/*: any*/),
          (v6/*: any*/),
          (v7/*: any*/),
          (v8/*: any*/),
          (v10/*: any*/),
          (v12/*: any*/),
          {
            "alias": null,
            "args": (v13/*: any*/),
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
                  (v14/*: any*/)
                ],
                "storageKey": null
              },
              (v16/*: any*/),
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
      (v2/*: any*/),
      (v0/*: any*/),
      (v1/*: any*/)
    ],
    "kind": "Operation",
    "name": "ProductDetailRouteQuery",
    "selections": [
      {
        "alias": null,
        "args": (v3/*: any*/),
        "concreteType": "Product",
        "kind": "LinkedField",
        "name": "product",
        "plural": false,
        "selections": [
          (v4/*: any*/),
          (v5/*: any*/),
          (v6/*: any*/),
          (v7/*: any*/),
          (v8/*: any*/),
          (v10/*: any*/),
          (v12/*: any*/),
          {
            "alias": null,
            "args": (v13/*: any*/),
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
                  (v14/*: any*/),
                  {
                    "alias": null,
                    "args": null,
                    "concreteType": "MerchantProduct",
                    "kind": "LinkedField",
                    "name": "node",
                    "plural": false,
                    "selections": [
                      (v4/*: any*/),
                      {
                        "alias": null,
                        "args": null,
                        "kind": "ScalarField",
                        "name": "url",
                        "storageKey": null
                      },
                      (v17/*: any*/),
                      {
                        "alias": null,
                        "args": null,
                        "concreteType": "Merchant",
                        "kind": "LinkedField",
                        "name": "merchant",
                        "plural": false,
                        "selections": (v9/*: any*/),
                        "storageKey": null
                      },
                      {
                        "alias": null,
                        "args": null,
                        "concreteType": "PricePoint",
                        "kind": "LinkedField",
                        "name": "latestPrice",
                        "plural": false,
                        "selections": (v18/*: any*/),
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
                              (v14/*: any*/),
                              {
                                "alias": null,
                                "args": null,
                                "concreteType": "ActiveCoupon",
                                "kind": "LinkedField",
                                "name": "node",
                                "plural": false,
                                "selections": [
                                  (v11/*: any*/),
                                  (v7/*: any*/),
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
                                  (v17/*: any*/),
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
                          (v19/*: any*/)
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
                                "selections": (v18/*: any*/),
                                "storageKey": null
                              }
                            ],
                            "storageKey": null
                          },
                          (v19/*: any*/)
                        ],
                        "storageKey": "priceHistory(first:3)"
                      }
                    ],
                    "storageKey": null
                  }
                ],
                "storageKey": null
              },
              (v16/*: any*/)
            ],
            "storageKey": null
          }
        ],
        "storageKey": null
      }
    ]
  },
  "params": {
    "cacheID": "0816b6de6af5560ce68a395490e0d94a",
    "id": null,
    "metadata": {},
    "name": "ProductDetailRouteQuery",
    "operationKind": "query",
    "text": "query ProductDetailRouteQuery(\n  $slug: String!\n  $offerFirst: Int!\n  $offersAfter: String\n) {\n  product(slug: $slug) {\n    id\n    name\n    slug\n    description\n    seo {\n      title\n      description\n      canonicalPath\n      indexable\n      imageUrl\n      structuredData\n    }\n    brand {\n      id\n      name\n    }\n    currentAttributes {\n      attributeId\n      code\n      displayName\n      dataType\n      valueText\n      sortOrder\n      groupLabel\n      isRequired\n      numericValue\n      booleanValue\n      enumOptionId\n      unitSymbol\n    }\n    merchantProducts(first: $offerFirst, after: $offersAfter, activeOnly: true) {\n      edges {\n        cursor\n      }\n      pageInfo {\n        endCursor\n        hasNextPage\n      }\n      ...ProductOfferPanel_connection\n    }\n  }\n}\n\nfragment ProductOfferPanel_connection on MerchantProductConnection {\n  edges {\n    node {\n      id\n      url\n      currency\n      merchant {\n        id\n        name\n      }\n      latestPrice {\n        id\n        price\n        observedAt\n      }\n      activeCoupons(first: 2) {\n        edges {\n          cursor\n          node {\n            code\n            description\n            discountType\n            discountValue\n            currency\n            validTo\n            terms\n          }\n        }\n        pageInfo {\n          hasNextPage\n        }\n      }\n      priceHistory(first: 3) {\n        edges {\n          node {\n            id\n            price\n            observedAt\n          }\n        }\n        pageInfo {\n          hasNextPage\n        }\n      }\n    }\n  }\n  pageInfo {\n    endCursor\n    hasNextPage\n  }\n}\n"
  }
};
})();

(node as any).hash = "a967ea94da7afae8e62c5ff14eeccc85";

export default node;

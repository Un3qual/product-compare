/**
 * @generated SignedSource<<56194588b0b8f98d29b97c68d271e689>>
 * @lightSyntaxTransform
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
import { FragmentRefs } from "relay-runtime";
export type MerchantProductsInput = {
  activeOnly?: boolean | null;
  merchantId?: string | null;
  productId: string;
};
export type OfferDiscoveryRouteQuery$variables = {
  after?: string | null;
  first: number;
  input: MerchantProductsInput;
  productId: string;
};
export type OfferDiscoveryRouteQuery$data = {
  readonly merchantProducts: {
    readonly " $fragmentSpreads": FragmentRefs<"OfferDiscoveryList_connection">;
  } | null;
  readonly selectedProduct: {
    readonly __typename: "Product";
    readonly brand: {
      readonly id: string;
      readonly name: string;
    } | null;
    readonly id: string;
    readonly name: string;
    readonly slug: string;
  } | {
    // This will never be '%other', but we need some
    // value in case none of the concrete values match.
    readonly __typename: "%other";
  } | null;
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
    (v3/*:: as any*/),
    (v4/*:: as any*/)
  ],
  "storageKey": null
},
v7 = [
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
v8 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "currency",
  "storageKey": null
},
v9 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "price",
  "storageKey": null
},
v10 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "observedAt",
  "storageKey": null
},
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
    (v11/*:: as any*/)
  ],
  "storageKey": null
};
return {
  "fragment": {
    "argumentDefinitions": (v0/*:: as any*/),
    "kind": "Fragment",
    "metadata": null,
    "name": "OfferDiscoveryRouteQuery",
    "selections": [
      {
        "alias": "selectedProduct",
        "args": (v1/*:: as any*/),
        "concreteType": null,
        "kind": "LinkedField",
        "name": "node",
        "plural": false,
        "selections": [
          (v2/*:: as any*/),
          {
            "kind": "InlineFragment",
            "selections": [
              (v3/*:: as any*/),
              (v4/*:: as any*/),
              (v5/*:: as any*/),
              (v6/*:: as any*/)
            ],
            "type": "Product",
            "abstractKey": null
          }
        ],
        "storageKey": null
      },
      {
        "alias": null,
        "args": (v7/*:: as any*/),
        "concreteType": "MerchantProductConnection",
        "kind": "LinkedField",
        "name": "merchantProducts",
        "plural": false,
        "selections": [
          {
            "args": null,
            "kind": "FragmentSpread",
            "name": "OfferDiscoveryList_connection"
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
    "argumentDefinitions": (v0/*:: as any*/),
    "kind": "Operation",
    "name": "OfferDiscoveryRouteQuery",
    "selections": [
      {
        "alias": "selectedProduct",
        "args": (v1/*:: as any*/),
        "concreteType": null,
        "kind": "LinkedField",
        "name": "node",
        "plural": false,
        "selections": [
          (v2/*:: as any*/),
          (v3/*:: as any*/),
          {
            "kind": "InlineFragment",
            "selections": [
              (v4/*:: as any*/),
              (v5/*:: as any*/),
              (v6/*:: as any*/)
            ],
            "type": "Product",
            "abstractKey": null
          }
        ],
        "storageKey": null
      },
      {
        "alias": null,
        "args": (v7/*:: as any*/),
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
                  (v3/*:: as any*/),
                  {
                    "alias": null,
                    "args": null,
                    "kind": "ScalarField",
                    "name": "url",
                    "storageKey": null
                  },
                  (v8/*:: as any*/),
                  {
                    "alias": null,
                    "args": null,
                    "concreteType": "Merchant",
                    "kind": "LinkedField",
                    "name": "merchant",
                    "plural": false,
                    "selections": [
                      (v3/*:: as any*/),
                      (v4/*:: as any*/),
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
                    "selections": [
                      (v9/*:: as any*/),
                      (v3/*:: as any*/),
                      (v10/*:: as any*/)
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
                            "kind": "ScalarField",
                            "name": "cursor",
                            "storageKey": null
                          },
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
                              (v8/*:: as any*/),
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
                      (v12/*:: as any*/)
                    ],
                    "storageKey": "activeCoupons(first:2)"
                  },
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
                    "concreteType": "Product",
                    "kind": "LinkedField",
                    "name": "product",
                    "plural": false,
                    "selections": [
                      (v3/*:: as any*/),
                      (v4/*:: as any*/),
                      (v5/*:: as any*/)
                    ],
                    "storageKey": null
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
                            "selections": [
                              (v3/*:: as any*/),
                              (v9/*:: as any*/),
                              (v10/*:: as any*/)
                            ],
                            "storageKey": null
                          }
                        ],
                        "storageKey": null
                      },
                      (v12/*:: as any*/)
                    ],
                    "storageKey": "priceHistory(first:12)"
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
              (v11/*:: as any*/),
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
      }
    ]
  },
  "params": {
    "cacheID": "d7eb27fbb1d93e04bde8a95c6b515fef",
    "id": null,
    "metadata": {},
    "name": "OfferDiscoveryRouteQuery",
    "operationKind": "query",
    "text": "query OfferDiscoveryRouteQuery(\n  $after: String\n  $first: Int!\n  $input: MerchantProductsInput!\n  $productId: ID!\n) {\n  selectedProduct: node(id: $productId) {\n    __typename\n    ... on Product {\n      id\n      name\n      slug\n      brand {\n        id\n        name\n      }\n    }\n    id\n  }\n  merchantProducts(after: $after, first: $first, input: $input) {\n    ...OfferDiscoveryList_connection\n  }\n}\n\nfragment OfferDiscoveryCard_offer on MerchantProduct {\n  id\n  url\n  currency\n  lastSeenAt\n  isActive\n  merchant {\n    id\n    name\n    domain\n  }\n  product {\n    id\n    name\n    slug\n  }\n  latestPrice {\n    id\n    price\n    observedAt\n  }\n  activeCoupons(first: 2) {\n    edges {\n      cursor\n      node {\n        code\n        description\n        discountType\n        discountValue\n        currency\n        validTo\n        terms\n      }\n    }\n    pageInfo {\n      hasNextPage\n    }\n  }\n  priceHistory(first: 12) {\n    edges {\n      node {\n        id\n        price\n        observedAt\n      }\n    }\n    pageInfo {\n      hasNextPage\n    }\n  }\n}\n\nfragment OfferDiscoveryList_connection on MerchantProductConnection {\n  edges {\n    node {\n      id\n      url\n      currency\n      merchant {\n        id\n        name\n      }\n      latestPrice {\n        price\n        id\n      }\n      activeCoupons(first: 2) {\n        edges {\n          cursor\n        }\n        pageInfo {\n          hasNextPage\n        }\n      }\n      ...OfferDiscoveryCard_offer\n    }\n  }\n  pageInfo {\n    endCursor\n    hasNextPage\n    hasPreviousPage\n  }\n}\n"
  }
};
})();

(node as any).hash = "edb0161bfa93b79a7cc5658b0b90f609";

export default node;

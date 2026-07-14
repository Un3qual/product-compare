/**
 * @generated SignedSource<<8c12ea794bcdb6972ef87105a0117bcf>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type MerchantDetailRouteQuery$variables = {
  after?: string | null | undefined;
  first: number;
  slug: string;
};
export type MerchantDetailRouteQuery$data = {
  readonly merchant: {
    readonly detailSummary: {
      readonly activeOfferCount: number;
      readonly agingOfferCount: number;
      readonly distinctProductCount: number;
      readonly eligibleOfferCount: number;
      readonly freshOfferCount: number;
      readonly lastObservedAt: any | null | undefined;
      readonly observedOfferCount: number;
      readonly staleOfferCount: number;
      readonly unobservedOfferCount: number;
    };
    readonly domain: string;
    readonly id: string;
    readonly merchantProducts: {
      readonly edges: ReadonlyArray<{
        readonly node: {
          readonly currency: string;
          readonly id: string;
          readonly latestPrice: {
            readonly id: string;
            readonly inStock: boolean | null | undefined;
            readonly observedAt: any;
            readonly price: any;
            readonly shipping: any | null | undefined;
          } | null | undefined;
          readonly product: {
            readonly id: string;
            readonly name: string;
            readonly slug: string;
          } | null | undefined;
        };
      }>;
      readonly pageInfo: {
        readonly endCursor: string | null | undefined;
        readonly hasNextPage: boolean;
      };
    };
    readonly name: string;
    readonly slug: string;
  } | null | undefined;
};
export type MerchantDetailRouteQuery = {
  response: MerchantDetailRouteQuery$data;
  variables: MerchantDetailRouteQuery$variables;
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
  "name": "slug",
  "storageKey": null
},
v6 = [
  {
    "alias": null,
    "args": [
      {
        "kind": "Variable",
        "name": "slug",
        "variableName": "slug"
      }
    ],
    "concreteType": "Merchant",
    "kind": "LinkedField",
    "name": "merchant",
    "plural": false,
    "selections": [
      (v3/*: any*/),
      (v4/*: any*/),
      (v5/*: any*/),
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "domain",
        "storageKey": null
      },
      {
        "alias": null,
        "args": null,
        "concreteType": "MerchantDetailSummary",
        "kind": "LinkedField",
        "name": "detailSummary",
        "plural": false,
        "selections": [
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "activeOfferCount",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "distinctProductCount",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "observedOfferCount",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "eligibleOfferCount",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "freshOfferCount",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "agingOfferCount",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "staleOfferCount",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "unobservedOfferCount",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "lastObservedAt",
            "storageKey": null
          }
        ],
        "storageKey": null
      },
      {
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
                    "selections": [
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
                        "name": "shipping",
                        "storageKey": null
                      },
                      {
                        "alias": null,
                        "args": null,
                        "kind": "ScalarField",
                        "name": "inStock",
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
                "name": "hasNextPage",
                "storageKey": null
              },
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "endCursor",
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
    "name": "MerchantDetailRouteQuery",
    "selections": (v6/*: any*/),
    "type": "RootQueryType",
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
    "name": "MerchantDetailRouteQuery",
    "selections": (v6/*: any*/)
  },
  "params": {
    "cacheID": "0ef50e0fdaa0346ffc438d2dd2cb4fe3",
    "id": null,
    "metadata": {},
    "name": "MerchantDetailRouteQuery",
    "operationKind": "query",
    "text": "query MerchantDetailRouteQuery(\n  $slug: String!\n  $first: Int!\n  $after: String\n) {\n  merchant(slug: $slug) {\n    id\n    name\n    slug\n    domain\n    detailSummary {\n      activeOfferCount\n      distinctProductCount\n      observedOfferCount\n      eligibleOfferCount\n      freshOfferCount\n      agingOfferCount\n      staleOfferCount\n      unobservedOfferCount\n      lastObservedAt\n    }\n    merchantProducts(first: $first, after: $after) {\n      edges {\n        node {\n          id\n          currency\n          product {\n            id\n            name\n            slug\n          }\n          latestPrice {\n            id\n            price\n            shipping\n            inStock\n            observedAt\n          }\n        }\n      }\n      pageInfo {\n        hasNextPage\n        endCursor\n      }\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "8b7264232c0fcecaea758d7bac6f9257";

export default node;

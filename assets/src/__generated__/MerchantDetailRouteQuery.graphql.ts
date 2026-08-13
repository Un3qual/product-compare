/**
 * @generated SignedSource<<a30a22fbcb16864f930196f5a04ef04c>>
 * @lightSyntaxTransform
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type MerchantDetailRouteQuery$variables = {
  after?: string | null;
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
      readonly lastObservedAt: string | null;
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
            readonly inStock: boolean | null;
            readonly observedAt: string;
            readonly price: string;
            readonly shipping: string | null;
          } | null;
          readonly product: {
            readonly id: string;
            readonly name: string;
            readonly slug: string;
          } | null;
        };
      }>;
      readonly pageInfo: {
        readonly endCursor: string | null;
        readonly hasNextPage: boolean;
      };
    };
    readonly name: string;
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
      (v3/*:: as any*/),
      (v4/*:: as any*/),
      (v5/*:: as any*/),
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
                  (v3/*:: as any*/),
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
                      (v3/*:: as any*/),
                      (v4/*:: as any*/),
                      (v5/*:: as any*/)
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
                      (v3/*:: as any*/),
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
      (v0/*:: as any*/),
      (v1/*:: as any*/),
      (v2/*:: as any*/)
    ],
    "kind": "Fragment",
    "metadata": null,
    "name": "MerchantDetailRouteQuery",
    "selections": (v6/*:: as any*/),
    "type": "RootQueryType",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": [
      (v2/*:: as any*/),
      (v1/*:: as any*/),
      (v0/*:: as any*/)
    ],
    "kind": "Operation",
    "name": "MerchantDetailRouteQuery",
    "selections": (v6/*:: as any*/)
  },
  "params": {
    "cacheID": "0780d52cc5fe3d954708358c67068533",
    "id": null,
    "metadata": {},
    "name": "MerchantDetailRouteQuery",
    "operationKind": "query",
    "text": "query MerchantDetailRouteQuery(\n  $slug: String!\n  $first: Int!\n  $after: String\n) {\n  merchant(slug: $slug) {\n    id\n    name\n    slug\n    domain\n    seo {\n      title\n      description\n      canonicalPath\n      indexable\n      imageUrl\n      structuredData\n    }\n    detailSummary {\n      activeOfferCount\n      distinctProductCount\n      observedOfferCount\n      eligibleOfferCount\n      freshOfferCount\n      agingOfferCount\n      staleOfferCount\n      unobservedOfferCount\n      lastObservedAt\n    }\n    merchantProducts(first: $first, after: $after) {\n      edges {\n        node {\n          id\n          currency\n          product {\n            id\n            name\n            slug\n          }\n          latestPrice {\n            id\n            price\n            shipping\n            inStock\n            observedAt\n          }\n        }\n      }\n      pageInfo {\n        hasNextPage\n        endCursor\n      }\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "f5606ac3d6bcea3e1bd8d13d0ad9fcf4";

export default node;

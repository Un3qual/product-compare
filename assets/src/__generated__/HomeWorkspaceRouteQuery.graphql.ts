/**
 * @generated SignedSource<<a29a24962068417a5536d90b55a5ffeb>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type HomePriceSignalCode = "AT_OR_ABOVE_30_DAY_MEDIAN" | "BELOW_30_DAY_MEDIAN" | "NO_30_DAY_BASELINE" | "%future added value";
export type HomeWorkspaceRouteQuery$variables = {
  selectedSlugs: ReadonlyArray<string>;
};
export type HomeWorkspaceRouteQuery$data = {
  readonly homeWorkspace: {
    readonly categories: ReadonlyArray<{
      readonly description: string;
      readonly id: string;
      readonly name: string;
      readonly qualifiedProductCount: number;
      readonly slug: string;
    }>;
    readonly products: ReadonlyArray<{
      readonly highlights: ReadonlyArray<{
        readonly label: string;
        readonly value: string;
      }>;
      readonly id: string;
      readonly name: string;
      readonly offer: {
        readonly activeOfferCount: number;
        readonly currency: string;
        readonly landedPrice: any;
        readonly merchantName: string;
        readonly merchantProductId: string;
        readonly observedAt: any;
        readonly priceSignal: HomePriceSignalCode;
      };
      readonly slug: string;
    }>;
    readonly selectedProducts: ReadonlyArray<{
      readonly id: string;
      readonly name: string;
      readonly slug: string;
    }>;
  };
};
export type HomeWorkspaceRouteQuery = {
  response: HomeWorkspaceRouteQuery$data;
  variables: HomeWorkspaceRouteQuery$variables;
};

const node: ConcreteRequest = (function(){
var v0 = [
  {
    "defaultValue": null,
    "kind": "LocalArgument",
    "name": "selectedSlugs"
  }
],
v1 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "id",
  "storageKey": null
},
v2 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "name",
  "storageKey": null
},
v3 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "slug",
  "storageKey": null
},
v4 = [
  {
    "alias": null,
    "args": [
      {
        "kind": "Variable",
        "name": "selectedSlugs",
        "variableName": "selectedSlugs"
      }
    ],
    "concreteType": "HomeWorkspace",
    "kind": "LinkedField",
    "name": "homeWorkspace",
    "plural": false,
    "selections": [
      {
        "alias": null,
        "args": null,
        "concreteType": "HomeCategoryShortcut",
        "kind": "LinkedField",
        "name": "categories",
        "plural": true,
        "selections": [
          (v1/*: any*/),
          (v2/*: any*/),
          (v3/*: any*/),
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
            "name": "qualifiedProductCount",
            "storageKey": null
          }
        ],
        "storageKey": null
      },
      {
        "alias": null,
        "args": null,
        "concreteType": "HomeProductSummary",
        "kind": "LinkedField",
        "name": "selectedProducts",
        "plural": true,
        "selections": [
          (v1/*: any*/),
          (v2/*: any*/),
          (v3/*: any*/)
        ],
        "storageKey": null
      },
      {
        "alias": null,
        "args": null,
        "concreteType": "HomeWorkspaceProduct",
        "kind": "LinkedField",
        "name": "products",
        "plural": true,
        "selections": [
          (v1/*: any*/),
          (v2/*: any*/),
          (v3/*: any*/),
          {
            "alias": null,
            "args": null,
            "concreteType": "HomeSpecificationHighlight",
            "kind": "LinkedField",
            "name": "highlights",
            "plural": true,
            "selections": [
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "label",
                "storageKey": null
              },
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "value",
                "storageKey": null
              }
            ],
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "concreteType": "HomeOfferSummary",
            "kind": "LinkedField",
            "name": "offer",
            "plural": false,
            "selections": [
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "merchantProductId",
                "storageKey": null
              },
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "merchantName",
                "storageKey": null
              },
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
                "kind": "ScalarField",
                "name": "landedPrice",
                "storageKey": null
              },
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
                "name": "priceSignal",
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
  }
];
return {
  "fragment": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Fragment",
    "metadata": null,
    "name": "HomeWorkspaceRouteQuery",
    "selections": (v4/*: any*/),
    "type": "RootQueryType",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "HomeWorkspaceRouteQuery",
    "selections": (v4/*: any*/)
  },
  "params": {
    "cacheID": "979e8234b0d6247fbcc2e6e0c3720b2c",
    "id": null,
    "metadata": {},
    "name": "HomeWorkspaceRouteQuery",
    "operationKind": "query",
    "text": "query HomeWorkspaceRouteQuery(\n  $selectedSlugs: [String!]!\n) {\n  homeWorkspace(selectedSlugs: $selectedSlugs) {\n    categories {\n      id\n      name\n      slug\n      description\n      qualifiedProductCount\n    }\n    selectedProducts {\n      id\n      name\n      slug\n    }\n    products {\n      id\n      name\n      slug\n      highlights {\n        label\n        value\n      }\n      offer {\n        merchantProductId\n        merchantName\n        currency\n        landedPrice\n        activeOfferCount\n        priceSignal\n        observedAt\n      }\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "a00ed0d33f2f7557a33603bcbae43b6f";

export default node;

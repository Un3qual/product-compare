/**
 * @generated SignedSource<<1fe0fb8ac69e940e56febd64a56538f4>>
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
      readonly name: string;
      readonly slug: string;
      readonly taxonId: string;
    }>;
    readonly products: ReadonlyArray<{
      readonly highlights: ReadonlyArray<{
        readonly label: string;
        readonly value: string;
      }>;
      readonly offer: {
        readonly currency: string;
        readonly landedPrice: any;
        readonly merchantName: string;
        readonly observedAt: any;
        readonly priceSignal: HomePriceSignalCode;
      };
      readonly product: {
        readonly id: string;
        readonly name: string;
        readonly slug: string;
      };
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
  "name": "name",
  "storageKey": null
},
v2 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "slug",
  "storageKey": null
},
v3 = [
  {
    "alias": null,
    "args": null,
    "kind": "ScalarField",
    "name": "id",
    "storageKey": null
  },
  (v1/*: any*/),
  (v2/*: any*/)
],
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
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "taxonId",
            "storageKey": null
          },
          (v1/*: any*/),
          (v2/*: any*/),
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "description",
            "storageKey": null
          }
        ],
        "storageKey": null
      },
      {
        "alias": null,
        "args": null,
        "concreteType": "Product",
        "kind": "LinkedField",
        "name": "selectedProducts",
        "plural": true,
        "selections": (v3/*: any*/),
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
          {
            "alias": null,
            "args": null,
            "concreteType": "Product",
            "kind": "LinkedField",
            "name": "product",
            "plural": false,
            "selections": (v3/*: any*/),
            "storageKey": null
          },
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
    "cacheID": "9a3cced0e1794018a60dc0e6d2d628b4",
    "id": null,
    "metadata": {},
    "name": "HomeWorkspaceRouteQuery",
    "operationKind": "query",
    "text": "query HomeWorkspaceRouteQuery(\n  $selectedSlugs: [String!]!\n) {\n  homeWorkspace(selectedSlugs: $selectedSlugs) {\n    categories {\n      taxonId\n      name\n      slug\n      description\n    }\n    selectedProducts {\n      id\n      name\n      slug\n    }\n    products {\n      product {\n        id\n        name\n        slug\n      }\n      highlights {\n        label\n        value\n      }\n      offer {\n        merchantName\n        currency\n        landedPrice\n        priceSignal\n        observedAt\n      }\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "8235d051447d1680fb6359e581fd42d0";

export default node;

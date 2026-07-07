/**
 * @generated SignedSource<<2fce86a9685d81d6e389ee2fd557f855>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type ProductFiltersInput = {
  booleans?: ReadonlyArray<ProductBooleanFilterInput> | null | undefined;
  enums?: ReadonlyArray<ProductEnumFilterInput> | null | undefined;
  includeTypeDescendants?: boolean | null | undefined;
  numeric?: ReadonlyArray<ProductNumericFilterInput> | null | undefined;
  primaryTypeTaxonId?: string | null | undefined;
  useCaseTaxonIds?: ReadonlyArray<string> | null | undefined;
};
export type ProductNumericFilterInput = {
  attributeId: string;
  max?: any | null | undefined;
  min?: any | null | undefined;
};
export type ProductBooleanFilterInput = {
  attributeId: string;
  value: boolean;
};
export type ProductEnumFilterInput = {
  attributeId: string;
  enumOptionId: string;
};
export type BrowseProductsRouteQuery$variables = {
  after?: string | null | undefined;
  filters?: ProductFiltersInput | null | undefined;
  first: number;
};
export type BrowseProductsRouteQuery$data = {
  readonly products: {
    readonly edges: ReadonlyArray<{
      readonly cursor: string;
      readonly node: {
        readonly brand: {
          readonly id: string;
          readonly name: string;
        };
        readonly currentAttributes: ReadonlyArray<{
          readonly code: string;
          readonly displayName: string;
          readonly sortOrder: number | null | undefined;
          readonly valueText: string;
        }>;
        readonly id: string;
        readonly name: string;
        readonly slug: string;
      };
    }>;
    readonly pageInfo: {
      readonly endCursor: string | null | undefined;
      readonly hasNextPage: boolean;
    };
  };
};
export type BrowseProductsRouteQuery = {
  response: BrowseProductsRouteQuery$data;
  variables: BrowseProductsRouteQuery$variables;
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
  "name": "filters"
},
v2 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "first"
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
v5 = [
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
        "name": "filters",
        "variableName": "filters"
      },
      {
        "kind": "Variable",
        "name": "first",
        "variableName": "first"
      }
    ],
    "concreteType": "ProductConnection",
    "kind": "LinkedField",
    "name": "products",
    "plural": false,
    "selections": [
      {
        "alias": null,
        "args": null,
        "concreteType": "ProductEdge",
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
            "concreteType": "Product",
            "kind": "LinkedField",
            "name": "node",
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
              {
                "alias": null,
                "args": null,
                "concreteType": "Brand",
                "kind": "LinkedField",
                "name": "brand",
                "plural": false,
                "selections": [
                  (v3/*: any*/),
                  (v4/*: any*/)
                ],
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
                    "name": "code",
                    "storageKey": null
                  },
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
                    "name": "valueText",
                    "storageKey": null
                  },
                  {
                    "alias": null,
                    "args": null,
                    "kind": "ScalarField",
                    "name": "sortOrder",
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
    "name": "BrowseProductsRouteQuery",
    "selections": (v5/*: any*/),
    "type": "Query",
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
    "name": "BrowseProductsRouteQuery",
    "selections": (v5/*: any*/)
  },
  "params": {
    "cacheID": "71396ef3a0dee1ba77f1cd153ca68ae7",
    "id": null,
    "metadata": {},
    "name": "BrowseProductsRouteQuery",
    "operationKind": "query",
    "text": "query BrowseProductsRouteQuery(\n  $first: Int!\n  $after: String\n  $filters: ProductFiltersInput\n) {\n  products(first: $first, after: $after, filters: $filters) {\n    edges {\n      cursor\n      node {\n        id\n        name\n        slug\n        brand {\n          id\n          name\n        }\n        currentAttributes {\n          code\n          displayName\n          valueText\n          sortOrder\n        }\n      }\n    }\n    pageInfo {\n      hasNextPage\n      endCursor\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "505713db801527641776b9d0a3f4bf3f";

export default node;

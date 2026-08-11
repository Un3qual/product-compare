/**
 * @generated SignedSource<<516b0834c1162a6e0c43ca54635adfab>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
import { FragmentRefs } from "relay-runtime";
export type ProductSort = "BRAND_NAME_ASC" | "ID_ASC" | "NAME_ASC" | "NEWEST" | "RELEVANCE" | "%future added value";
export type ProductFiltersInput = {
  booleans?: ReadonlyArray<ProductBooleanFilterInput> | null | undefined;
  enums?: ReadonlyArray<ProductEnumFilterInput> | null | undefined;
  includeTypeDescendants?: boolean | null | undefined;
  numeric?: ReadonlyArray<ProductNumericFilterInput> | null | undefined;
  primaryTypeTaxonId?: string | null | undefined;
  query?: string | null | undefined;
  sort?: ProductSort | null | undefined;
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
export type BrowseRouteQuery$variables = {
  after?: string | null | undefined;
  filters?: ProductFiltersInput | null | undefined;
  first: number;
};
export type BrowseRouteQuery$data = {
  readonly productFilterMetadata: {
    readonly booleanFilters: ReadonlyArray<{
      readonly attributeId: string;
      readonly code: string;
      readonly displayName: string;
      readonly falseCount: number;
      readonly selectedValue: boolean | null | undefined;
      readonly trueCount: number;
    }>;
    readonly enumFilters: ReadonlyArray<{
      readonly attributeId: string;
      readonly code: string;
      readonly displayName: string;
      readonly options: ReadonlyArray<{
        readonly count: number;
        readonly disabled: boolean;
        readonly id: string;
        readonly label: string;
        readonly selected: boolean;
      }>;
    }>;
    readonly numericFilters: ReadonlyArray<{
      readonly attributeId: string;
      readonly code: string;
      readonly displayName: string;
      readonly max: any | null | undefined;
      readonly min: any | null | undefined;
      readonly selectedMax: any | null | undefined;
      readonly selectedMin: any | null | undefined;
      readonly unitSymbol: string | null | undefined;
    }>;
    readonly resultCount: number;
    readonly typeOptions: ReadonlyArray<{
      readonly count: number;
      readonly disabled: boolean;
      readonly id: string;
      readonly label: string;
      readonly selected: boolean;
    }>;
    readonly useCaseOptions: ReadonlyArray<{
      readonly count: number;
      readonly disabled: boolean;
      readonly id: string;
      readonly label: string;
      readonly selected: boolean;
    }>;
  };
  readonly products: {
    readonly edges: ReadonlyArray<{
      readonly cursor: string;
      readonly node: {
        readonly id: string;
        readonly name: string;
        readonly slug: string;
      };
    }>;
    readonly pageInfo: {
      readonly endCursor: string | null | undefined;
      readonly hasNextPage: boolean;
    };
    readonly " $fragmentSpreads": FragmentRefs<"BrowseProductList_products">;
  } | null | undefined;
};
export type BrowseRouteQuery = {
  response: BrowseRouteQuery$data;
  variables: BrowseRouteQuery$variables;
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
  "kind": "Variable",
  "name": "filters",
  "variableName": "filters"
},
v4 = [
  {
    "kind": "Variable",
    "name": "after",
    "variableName": "after"
  },
  (v3/*: any*/),
  {
    "kind": "Variable",
    "name": "first",
    "variableName": "first"
  }
],
v5 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "cursor",
  "storageKey": null
},
v6 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "id",
  "storageKey": null
},
v7 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "name",
  "storageKey": null
},
v8 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "slug",
  "storageKey": null
},
v9 = {
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
},
v10 = [
  (v6/*: any*/),
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
    "name": "count",
    "storageKey": null
  },
  {
    "alias": null,
    "args": null,
    "kind": "ScalarField",
    "name": "selected",
    "storageKey": null
  },
  {
    "alias": null,
    "args": null,
    "kind": "ScalarField",
    "name": "disabled",
    "storageKey": null
  }
],
v11 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "attributeId",
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
  "kind": "ScalarField",
  "name": "displayName",
  "storageKey": null
},
v14 = {
  "alias": null,
  "args": [
    (v3/*: any*/)
  ],
  "concreteType": "ProductFilterMetadata",
  "kind": "LinkedField",
  "name": "productFilterMetadata",
  "plural": false,
  "selections": [
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "resultCount",
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "concreteType": "ProductFilterOption",
      "kind": "LinkedField",
      "name": "typeOptions",
      "plural": true,
      "selections": (v10/*: any*/),
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "concreteType": "ProductFilterOption",
      "kind": "LinkedField",
      "name": "useCaseOptions",
      "plural": true,
      "selections": (v10/*: any*/),
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "concreteType": "ProductNumericFilterMetadata",
      "kind": "LinkedField",
      "name": "numericFilters",
      "plural": true,
      "selections": [
        (v11/*: any*/),
        (v12/*: any*/),
        (v13/*: any*/),
        {
          "alias": null,
          "args": null,
          "kind": "ScalarField",
          "name": "unitSymbol",
          "storageKey": null
        },
        {
          "alias": null,
          "args": null,
          "kind": "ScalarField",
          "name": "min",
          "storageKey": null
        },
        {
          "alias": null,
          "args": null,
          "kind": "ScalarField",
          "name": "max",
          "storageKey": null
        },
        {
          "alias": null,
          "args": null,
          "kind": "ScalarField",
          "name": "selectedMin",
          "storageKey": null
        },
        {
          "alias": null,
          "args": null,
          "kind": "ScalarField",
          "name": "selectedMax",
          "storageKey": null
        }
      ],
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "concreteType": "ProductBooleanFilterMetadata",
      "kind": "LinkedField",
      "name": "booleanFilters",
      "plural": true,
      "selections": [
        (v11/*: any*/),
        (v12/*: any*/),
        (v13/*: any*/),
        {
          "alias": null,
          "args": null,
          "kind": "ScalarField",
          "name": "trueCount",
          "storageKey": null
        },
        {
          "alias": null,
          "args": null,
          "kind": "ScalarField",
          "name": "falseCount",
          "storageKey": null
        },
        {
          "alias": null,
          "args": null,
          "kind": "ScalarField",
          "name": "selectedValue",
          "storageKey": null
        }
      ],
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "concreteType": "ProductEnumFilterMetadata",
      "kind": "LinkedField",
      "name": "enumFilters",
      "plural": true,
      "selections": [
        (v11/*: any*/),
        (v12/*: any*/),
        (v13/*: any*/),
        {
          "alias": null,
          "args": null,
          "concreteType": "ProductFilterOption",
          "kind": "LinkedField",
          "name": "options",
          "plural": true,
          "selections": (v10/*: any*/),
          "storageKey": null
        }
      ],
      "storageKey": null
    }
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
    "name": "BrowseRouteQuery",
    "selections": [
      {
        "alias": null,
        "args": (v4/*: any*/),
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
              (v5/*: any*/),
              {
                "alias": null,
                "args": null,
                "concreteType": "Product",
                "kind": "LinkedField",
                "name": "node",
                "plural": false,
                "selections": [
                  (v6/*: any*/),
                  (v7/*: any*/),
                  (v8/*: any*/)
                ],
                "storageKey": null
              }
            ],
            "storageKey": null
          },
          {
            "args": null,
            "kind": "FragmentSpread",
            "name": "BrowseProductList_products"
          },
          (v9/*: any*/)
        ],
        "storageKey": null
      },
      (v14/*: any*/)
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
    "name": "BrowseRouteQuery",
    "selections": [
      {
        "alias": null,
        "args": (v4/*: any*/),
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
              (v5/*: any*/),
              {
                "alias": null,
                "args": null,
                "concreteType": "Product",
                "kind": "LinkedField",
                "name": "node",
                "plural": false,
                "selections": [
                  (v6/*: any*/),
                  (v7/*: any*/),
                  (v8/*: any*/),
                  {
                    "alias": null,
                    "args": null,
                    "concreteType": "Brand",
                    "kind": "LinkedField",
                    "name": "brand",
                    "plural": false,
                    "selections": [
                      (v6/*: any*/),
                      (v7/*: any*/)
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
                      (v12/*: any*/),
                      (v13/*: any*/),
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
          (v9/*: any*/)
        ],
        "storageKey": null
      },
      (v14/*: any*/)
    ]
  },
  "params": {
    "cacheID": "65796a0582f3b1d85d8da85ae5ce82fb",
    "id": null,
    "metadata": {},
    "name": "BrowseRouteQuery",
    "operationKind": "query",
    "text": "query BrowseRouteQuery(\n  $first: Int!\n  $after: String\n  $filters: ProductFiltersInput\n) {\n  products(first: $first, after: $after, filters: $filters) {\n    edges {\n      cursor\n      node {\n        id\n        name\n        slug\n      }\n    }\n    ...BrowseProductList_products\n    pageInfo {\n      hasNextPage\n      endCursor\n    }\n  }\n  productFilterMetadata(filters: $filters) {\n    resultCount\n    typeOptions {\n      id\n      label\n      count\n      selected\n      disabled\n    }\n    useCaseOptions {\n      id\n      label\n      count\n      selected\n      disabled\n    }\n    numericFilters {\n      attributeId\n      code\n      displayName\n      unitSymbol\n      min\n      max\n      selectedMin\n      selectedMax\n    }\n    booleanFilters {\n      attributeId\n      code\n      displayName\n      trueCount\n      falseCount\n      selectedValue\n    }\n    enumFilters {\n      attributeId\n      code\n      displayName\n      options {\n        id\n        label\n        count\n        selected\n        disabled\n      }\n    }\n  }\n}\n\nfragment BrowseProductList_item on Product {\n  id\n  name\n  slug\n  brand {\n    id\n    name\n  }\n  currentAttributes {\n    code\n    displayName\n    valueText\n    sortOrder\n  }\n}\n\nfragment BrowseProductList_products on ProductConnection {\n  edges {\n    node {\n      id\n      name\n      slug\n      ...BrowseProductList_item\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "0885b5c4052a26abc6af032afe096a6a";

export default node;

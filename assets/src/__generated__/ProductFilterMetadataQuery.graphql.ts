/**
 * @generated SignedSource<<7d793120b92b2b8ddfa6bba680ac0db3>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type ProductSort = "BRAND_NAME_ASC" | "ID_ASC" | "NAME_ASC" | "NEWEST" | "%future added value";
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
export type ProductFilterMetadataQuery$variables = {
  filters?: ProductFiltersInput | null | undefined;
};
export type ProductFilterMetadataQuery$data = {
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
};
export type ProductFilterMetadataQuery = {
  response: ProductFilterMetadataQuery$data;
  variables: ProductFilterMetadataQuery$variables;
};

const node: ConcreteRequest = (function(){
var v0 = [
  {
    "defaultValue": null,
    "kind": "LocalArgument",
    "name": "filters"
  }
],
v1 = [
  {
    "alias": null,
    "args": null,
    "kind": "ScalarField",
    "name": "id",
    "storageKey": null
  },
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
v2 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "attributeId",
  "storageKey": null
},
v3 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "code",
  "storageKey": null
},
v4 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "displayName",
  "storageKey": null
},
v5 = [
  {
    "alias": null,
    "args": [
      {
        "kind": "Variable",
        "name": "filters",
        "variableName": "filters"
      }
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
        "selections": (v1/*: any*/),
        "storageKey": null
      },
      {
        "alias": null,
        "args": null,
        "concreteType": "ProductFilterOption",
        "kind": "LinkedField",
        "name": "useCaseOptions",
        "plural": true,
        "selections": (v1/*: any*/),
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
          (v2/*: any*/),
          (v3/*: any*/),
          (v4/*: any*/),
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
          (v2/*: any*/),
          (v3/*: any*/),
          (v4/*: any*/),
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
          (v2/*: any*/),
          (v3/*: any*/),
          (v4/*: any*/),
          {
            "alias": null,
            "args": null,
            "concreteType": "ProductFilterOption",
            "kind": "LinkedField",
            "name": "options",
            "plural": true,
            "selections": (v1/*: any*/),
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
    "name": "ProductFilterMetadataQuery",
    "selections": (v5/*: any*/),
    "type": "Query",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "ProductFilterMetadataQuery",
    "selections": (v5/*: any*/)
  },
  "params": {
    "cacheID": "727b3fd0af36a8fe0328cb40d4412a3a",
    "id": null,
    "metadata": {},
    "name": "ProductFilterMetadataQuery",
    "operationKind": "query",
    "text": "query ProductFilterMetadataQuery(\n  $filters: ProductFiltersInput\n) {\n  productFilterMetadata(filters: $filters) {\n    resultCount\n    typeOptions {\n      id\n      label\n      count\n      selected\n      disabled\n    }\n    useCaseOptions {\n      id\n      label\n      count\n      selected\n      disabled\n    }\n    numericFilters {\n      attributeId\n      code\n      displayName\n      unitSymbol\n      min\n      max\n      selectedMin\n      selectedMax\n    }\n    booleanFilters {\n      attributeId\n      code\n      displayName\n      trueCount\n      falseCount\n      selectedValue\n    }\n    enumFilters {\n      attributeId\n      code\n      displayName\n      options {\n        id\n        label\n        count\n        selected\n        disabled\n      }\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "13c619ff9d9099e597ee22d016d40faa";

export default node;

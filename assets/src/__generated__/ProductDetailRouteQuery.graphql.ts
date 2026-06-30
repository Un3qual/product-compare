/**
 * @generated SignedSource<<59b4f44f212a4c313d2a227d26445a7f>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type ProductDetailRouteQuery$variables = {
  slug: string;
};
export type ProductDetailRouteQuery$data = {
  readonly product: {
    readonly brand: {
      readonly id: string;
      readonly name: string;
    };
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
    readonly name: string;
    readonly slug: string;
  } | null | undefined;
};
export type ProductDetailRouteQuery = {
  response: ProductDetailRouteQuery$data;
  variables: ProductDetailRouteQuery$variables;
};

const node: ConcreteRequest = (function(){
var v0 = [
  {
    "defaultValue": null,
    "kind": "LocalArgument",
    "name": "slug"
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
v3 = [
  {
    "alias": null,
    "args": [
      {
        "kind": "Variable",
        "name": "slug",
        "variableName": "slug"
      }
    ],
    "concreteType": "Product",
    "kind": "LinkedField",
    "name": "product",
    "plural": false,
    "selections": [
      (v1/*: any*/),
      (v2/*: any*/),
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
        "kind": "ScalarField",
        "name": "description",
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
          (v1/*: any*/),
          (v2/*: any*/)
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
            "name": "attributeId",
            "storageKey": null
          },
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
    "name": "ProductDetailRouteQuery",
    "selections": (v3/*: any*/),
    "type": "Query",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "ProductDetailRouteQuery",
    "selections": (v3/*: any*/)
  },
  "params": {
    "cacheID": "c6d5eccde5dae38d013d44ba67fe20a5",
    "id": null,
    "metadata": {},
    "name": "ProductDetailRouteQuery",
    "operationKind": "query",
    "text": "query ProductDetailRouteQuery(\n  $slug: String!\n) {\n  product(slug: $slug) {\n    id\n    name\n    slug\n    description\n    brand {\n      id\n      name\n    }\n    currentAttributes {\n      attributeId\n      code\n      displayName\n      dataType\n      valueText\n      sortOrder\n      groupLabel\n      isRequired\n      numericValue\n      booleanValue\n      enumOptionId\n      unitSymbol\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "c66ade7d013b1780c6366601a08ff4e6";

export default node;

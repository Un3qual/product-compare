/**
 * @generated SignedSource<<81c0987fd199398c21aa41622832211d>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type ProductOffersRouteQuery$variables = {
  first: number;
  productId: string;
};
export type ProductOffersRouteQuery$data = {
  readonly merchantProducts: {
    readonly edges: ReadonlyArray<{
      readonly node: {
        readonly currency: string;
        readonly id: string;
        readonly latestPrice: {
          readonly id: string;
          readonly price: any;
        } | null | undefined;
        readonly merchant: {
          readonly id: string;
          readonly name: string;
        } | null | undefined;
        readonly url: string;
      };
    }>;
  };
};
export type ProductOffersRouteQuery = {
  response: ProductOffersRouteQuery$data;
  variables: ProductOffersRouteQuery$variables;
};

const node: ConcreteRequest = (function(){
var v0 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "first"
},
v1 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "productId"
},
v2 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "id",
  "storageKey": null
},
v3 = [
  {
    "alias": null,
    "args": [
      {
        "fields": [
          {
            "kind": "Literal",
            "name": "activeOnly",
            "value": true
          },
          {
            "kind": "Variable",
            "name": "first",
            "variableName": "first"
          },
          {
            "kind": "Variable",
            "name": "productId",
            "variableName": "productId"
          }
        ],
        "kind": "ObjectValue",
        "name": "input"
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
              (v2/*: any*/),
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "url",
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
                "concreteType": "Merchant",
                "kind": "LinkedField",
                "name": "merchant",
                "plural": false,
                "selections": [
                  (v2/*: any*/),
                  {
                    "alias": null,
                    "args": null,
                    "kind": "ScalarField",
                    "name": "name",
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
                  (v2/*: any*/),
                  {
                    "alias": null,
                    "args": null,
                    "kind": "ScalarField",
                    "name": "price",
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
    ],
    "storageKey": null
  }
];
return {
  "fragment": {
    "argumentDefinitions": [
      (v0/*: any*/),
      (v1/*: any*/)
    ],
    "kind": "Fragment",
    "metadata": null,
    "name": "ProductOffersRouteQuery",
    "selections": (v3/*: any*/),
    "type": "Query",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": [
      (v1/*: any*/),
      (v0/*: any*/)
    ],
    "kind": "Operation",
    "name": "ProductOffersRouteQuery",
    "selections": (v3/*: any*/)
  },
  "params": {
    "cacheID": "1be9037c774d25613d9b0c1be1faab24",
    "id": null,
    "metadata": {},
    "name": "ProductOffersRouteQuery",
    "operationKind": "query",
    "text": "query ProductOffersRouteQuery(\n  $productId: ID!\n  $first: Int!\n) {\n  merchantProducts(input: {productId: $productId, activeOnly: true, first: $first}) {\n    edges {\n      node {\n        id\n        url\n        currency\n        merchant {\n          id\n          name\n        }\n        latestPrice {\n          id\n          price\n        }\n      }\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "865363d3041a4f472731699c831bef54";

export default node;

/**
 * @generated SignedSource<<75b3efb6b0d6b7a17f7c53f4d64d47ee>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type RevenueSummaryInput = {
  currency?: string | null;
  from?: string | null;
  merchantId?: string | null;
  network?: string | null;
  productId?: string | null;
  to?: string | null;
};
export type RevenueSummaryRouteQuery$variables = {
  input?: RevenueSummaryInput | null;
};
export type RevenueSummaryRouteQuery$data = {
  readonly revenueSummary: {
    readonly filters: {
      readonly currency: string | null;
      readonly from: string | null;
      readonly merchantId: string | null;
      readonly network: string | null;
      readonly productId: string | null;
      readonly to: string | null;
    };
    readonly metrics: {
      readonly averagePaidPrice: string | null;
      readonly clicks: number | null;
      readonly commissionRevenue: string | null;
      readonly conversions: number | null;
      readonly currency: string | null;
      readonly grossOrderValue: string | null;
    };
  } | null;
};
export type RevenueSummaryRouteQuery = {
  response: RevenueSummaryRouteQuery$data;
  variables: RevenueSummaryRouteQuery$variables;
};

const node: ConcreteRequest = (function(){
var v0 = [
  {
    "defaultValue": null,
    "kind": "LocalArgument",
    "name": "input"
  }
],
v1 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "currency",
  "storageKey": null
},
v2 = [
  {
    "alias": null,
    "args": [
      {
        "kind": "Variable",
        "name": "input",
        "variableName": "input"
      }
    ],
    "concreteType": "RevenueSummary",
    "kind": "LinkedField",
    "name": "revenueSummary",
    "plural": false,
    "selections": [
      {
        "alias": null,
        "args": null,
        "concreteType": "RevenueSummaryFilters",
        "kind": "LinkedField",
        "name": "filters",
        "plural": false,
        "selections": [
          (v1/*: any*/),
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "from",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "merchantId",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "network",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "productId",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "to",
            "storageKey": null
          }
        ],
        "storageKey": null
      },
      {
        "alias": null,
        "args": null,
        "concreteType": "RevenueSummaryMetrics",
        "kind": "LinkedField",
        "name": "metrics",
        "plural": false,
        "selections": [
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "averagePaidPrice",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "clicks",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "commissionRevenue",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "conversions",
            "storageKey": null
          },
          (v1/*: any*/),
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "grossOrderValue",
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
    "name": "RevenueSummaryRouteQuery",
    "selections": (v2/*: any*/),
    "type": "RootQueryType",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "RevenueSummaryRouteQuery",
    "selections": (v2/*: any*/)
  },
  "params": {
    "cacheID": "73aaa913d38fe428bfc197e5595d7ee7",
    "id": null,
    "metadata": {},
    "name": "RevenueSummaryRouteQuery",
    "operationKind": "query",
    "text": "query RevenueSummaryRouteQuery(\n  $input: RevenueSummaryInput\n) {\n  revenueSummary(input: $input) {\n    filters {\n      currency\n      from\n      merchantId\n      network\n      productId\n      to\n    }\n    metrics {\n      averagePaidPrice\n      clicks\n      commissionRevenue\n      conversions\n      currency\n      grossOrderValue\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "1ead8471a01cfc1d03e64b438b838920";

export default node;

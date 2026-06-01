/**
 * @generated SignedSource<<9633b93b440e356b0ef594a725fbbfae>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type RevenueSummaryInput = {
  currency?: string | null | undefined;
  from?: string | null | undefined;
  merchantId?: string | null | undefined;
  network?: string | null | undefined;
  productId?: string | null | undefined;
  to?: string | null | undefined;
};
export type RevenueSummaryRouteQuery$variables = {
  input?: RevenueSummaryInput | null | undefined;
};
export type RevenueSummaryRouteQuery$data = {
  readonly revenueSummary: {
    readonly filters: {
      readonly currency: string | null | undefined;
      readonly from: string | null | undefined;
      readonly merchantId: string | null | undefined;
      readonly network: string | null | undefined;
      readonly productId: string | null | undefined;
      readonly to: string | null | undefined;
    };
    readonly metrics: {
      readonly averagePaidPrice: string | null | undefined;
      readonly clicks: number | null | undefined;
      readonly commissionRevenue: string | null | undefined;
      readonly conversions: number | null | undefined;
      readonly currency: string | null | undefined;
      readonly grossOrderValue: string | null | undefined;
    };
    readonly suppression: {
      readonly suppressed: boolean;
      readonly threshold: number;
    };
  } | null | undefined;
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
      },
      {
        "alias": null,
        "args": null,
        "concreteType": "RevenueSummarySuppression",
        "kind": "LinkedField",
        "name": "suppression",
        "plural": false,
        "selections": [
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "suppressed",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "threshold",
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
    "type": "Query",
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
    "cacheID": "f3adc6fcff6a60ce684c0de93ef5cc3e",
    "id": null,
    "metadata": {},
    "name": "RevenueSummaryRouteQuery",
    "operationKind": "query",
    "text": "query RevenueSummaryRouteQuery(\n  $input: RevenueSummaryInput\n) {\n  revenueSummary(input: $input) {\n    filters {\n      currency\n      from\n      merchantId\n      network\n      productId\n      to\n    }\n    metrics {\n      averagePaidPrice\n      clicks\n      commissionRevenue\n      conversions\n      currency\n      grossOrderValue\n    }\n    suppression {\n      suppressed\n      threshold\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "6344de9da3f9cd72731110b4eea18f2f";

export default node;

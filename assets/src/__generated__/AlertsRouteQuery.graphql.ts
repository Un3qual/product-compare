/**
 * @generated SignedSource<<23f6331d92c8ee90cfd5f839d66e4f7b>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type PriceWatchRuleType = "BACK_IN_STOCK" | "NEWLY_AVAILABLE" | "PERCENTAGE_DROP" | "TARGET_PRICE" | "%future added value";
export type AlertsRouteQuery$variables = {
  first: number;
};
export type AlertsRouteQuery$data = {
  readonly myAlertEvents: {
    readonly edges: ReadonlyArray<{
      readonly node: {
        readonly currency: string;
        readonly id: string;
        readonly landedPrice: any;
        readonly merchantName: string;
        readonly observedAt: any;
        readonly productName: string;
        readonly productSlug: string;
        readonly readAt: any | null | undefined;
        readonly ruleType: PriceWatchRuleType;
      };
    }>;
    readonly pageInfo: {
      readonly hasNextPage: boolean;
    };
  };
  readonly myPriceWatches: {
    readonly edges: ReadonlyArray<{
      readonly node: {
        readonly baselineLandedPrice: any | null | undefined;
        readonly currency: string;
        readonly enabled: boolean;
        readonly id: string;
        readonly merchantName: string | null | undefined;
        readonly percentageDrop: any | null | undefined;
        readonly productName: string;
        readonly productSlug: string;
        readonly ruleType: PriceWatchRuleType;
        readonly targetAmount: any | null | undefined;
      };
    }>;
    readonly pageInfo: {
      readonly hasNextPage: boolean;
    };
  };
};
export type AlertsRouteQuery = {
  response: AlertsRouteQuery$data;
  variables: AlertsRouteQuery$variables;
};

const node: ConcreteRequest = (function(){
var v0 = [
  {
    "defaultValue": null,
    "kind": "LocalArgument",
    "name": "first"
  }
],
v1 = {
  "kind": "Variable",
  "name": "first",
  "variableName": "first"
},
v2 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "id",
  "storageKey": null
},
v3 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "productName",
  "storageKey": null
},
v4 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "productSlug",
  "storageKey": null
},
v5 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "merchantName",
  "storageKey": null
},
v6 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "ruleType",
  "storageKey": null
},
v7 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "currency",
  "storageKey": null
},
v8 = {
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
    }
  ],
  "storageKey": null
},
v9 = [
  {
    "alias": null,
    "args": [
      (v1/*: any*/)
    ],
    "concreteType": "AlertEventConnection",
    "kind": "LinkedField",
    "name": "myAlertEvents",
    "plural": false,
    "selections": [
      {
        "alias": null,
        "args": null,
        "concreteType": "AlertEventEdge",
        "kind": "LinkedField",
        "name": "edges",
        "plural": true,
        "selections": [
          {
            "alias": null,
            "args": null,
            "concreteType": "AlertEvent",
            "kind": "LinkedField",
            "name": "node",
            "plural": false,
            "selections": [
              (v2/*: any*/),
              (v3/*: any*/),
              (v4/*: any*/),
              (v5/*: any*/),
              (v6/*: any*/),
              (v7/*: any*/),
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
                "name": "observedAt",
                "storageKey": null
              },
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "readAt",
                "storageKey": null
              }
            ],
            "storageKey": null
          }
        ],
        "storageKey": null
      },
      (v8/*: any*/)
    ],
    "storageKey": null
  },
  {
    "alias": null,
    "args": [
      {
        "kind": "Literal",
        "name": "enabled",
        "value": true
      },
      (v1/*: any*/)
    ],
    "concreteType": "PriceWatchConnection",
    "kind": "LinkedField",
    "name": "myPriceWatches",
    "plural": false,
    "selections": [
      {
        "alias": null,
        "args": null,
        "concreteType": "PriceWatchEdge",
        "kind": "LinkedField",
        "name": "edges",
        "plural": true,
        "selections": [
          {
            "alias": null,
            "args": null,
            "concreteType": "PriceWatch",
            "kind": "LinkedField",
            "name": "node",
            "plural": false,
            "selections": [
              (v2/*: any*/),
              (v3/*: any*/),
              (v4/*: any*/),
              (v5/*: any*/),
              (v6/*: any*/),
              (v7/*: any*/),
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "targetAmount",
                "storageKey": null
              },
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "percentageDrop",
                "storageKey": null
              },
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "baselineLandedPrice",
                "storageKey": null
              },
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "enabled",
                "storageKey": null
              }
            ],
            "storageKey": null
          }
        ],
        "storageKey": null
      },
      (v8/*: any*/)
    ],
    "storageKey": null
  }
];
return {
  "fragment": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Fragment",
    "metadata": null,
    "name": "AlertsRouteQuery",
    "selections": (v9/*: any*/),
    "type": "RootQueryType",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "AlertsRouteQuery",
    "selections": (v9/*: any*/)
  },
  "params": {
    "cacheID": "a3d2192f8c7159742a24607dbf36cd37",
    "id": null,
    "metadata": {},
    "name": "AlertsRouteQuery",
    "operationKind": "query",
    "text": "query AlertsRouteQuery(\n  $first: Int!\n) {\n  myAlertEvents(first: $first) {\n    edges {\n      node {\n        id\n        productName\n        productSlug\n        merchantName\n        ruleType\n        currency\n        landedPrice\n        observedAt\n        readAt\n      }\n    }\n    pageInfo {\n      hasNextPage\n    }\n  }\n  myPriceWatches(first: $first, enabled: true) {\n    edges {\n      node {\n        id\n        productName\n        productSlug\n        merchantName\n        ruleType\n        currency\n        targetAmount\n        percentageDrop\n        baselineLandedPrice\n        enabled\n      }\n    }\n    pageInfo {\n      hasNextPage\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "37ba30a8f141dfca1b594fdf8a0a9883";

export default node;

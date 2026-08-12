/**
 * @generated SignedSource<<f60b3e3f4b39f774834e5a5816cc9fca>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type SharedComparisonRouteQuery$variables = {
  token: string;
};
export type SharedComparisonRouteQuery$data = {
  readonly comparisonSnapshot: {
    readonly capturedAt: any;
    readonly disclaimer: string;
    readonly products: ReadonlyArray<{
      readonly attributes: ReadonlyArray<{
        readonly claimId: string;
        readonly displayName: string;
        readonly evidence: ReadonlyArray<{
          readonly sourceName: string;
        }>;
        readonly valueText: string;
      }>;
      readonly brandName: string | null | undefined;
      readonly description: string | null | undefined;
      readonly id: string;
      readonly modelNumber: string | null | undefined;
      readonly name: string;
      readonly offers: ReadonlyArray<{
        readonly currency: string;
        readonly landedPrice: any;
        readonly merchantName: string;
        readonly observedAt: any;
        readonly pricePointId: string;
      }>;
      readonly slug: string;
    }>;
    readonly recommendation: {
      readonly evaluatedAt: any;
      readonly missingInputs: ReadonlyArray<string>;
      readonly rankings: ReadonlyArray<{
        readonly productId: string;
        readonly productName: string;
        readonly reasons: ReadonlyArray<string>;
      }>;
      readonly winnerProductId: string | null | undefined;
    };
    readonly seo: {
      readonly canonicalPath: string;
      readonly description: string;
      readonly imageUrl: string | null | undefined;
      readonly indexable: boolean;
      readonly structuredData: string | null | undefined;
      readonly title: string;
    };
    readonly title: string | null | undefined;
  } | null | undefined;
};
export type SharedComparisonRouteQuery = {
  response: SharedComparisonRouteQuery$data;
  variables: SharedComparisonRouteQuery$variables;
};

const node: ConcreteRequest = (function(){
var v0 = [
  {
    "defaultValue": null,
    "kind": "LocalArgument",
    "name": "token"
  }
],
v1 = [
  {
    "kind": "Variable",
    "name": "token",
    "variableName": "token"
  }
],
v2 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "title",
  "storageKey": null
},
v3 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "description",
  "storageKey": null
},
v4 = {
  "alias": null,
  "args": null,
  "concreteType": "SeoMetadata",
  "kind": "LinkedField",
  "name": "seo",
  "plural": false,
  "selections": [
    (v2/*: any*/),
    (v3/*: any*/),
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "canonicalPath",
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "indexable",
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "imageUrl",
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "structuredData",
      "storageKey": null
    }
  ],
  "storageKey": null
},
v5 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "capturedAt",
  "storageKey": null
},
v6 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "disclaimer",
  "storageKey": null
},
v7 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "id",
  "storageKey": null
},
v8 = {
  "alias": null,
  "args": null,
  "concreteType": "ComparisonSnapshotProduct",
  "kind": "LinkedField",
  "name": "products",
  "plural": true,
  "selections": [
    (v7/*: any*/),
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "name",
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "slug",
      "storageKey": null
    },
    (v3/*: any*/),
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "modelNumber",
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "brandName",
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "concreteType": "ComparisonSnapshotAttribute",
      "kind": "LinkedField",
      "name": "attributes",
      "plural": true,
      "selections": [
        {
          "alias": null,
          "args": null,
          "kind": "ScalarField",
          "name": "claimId",
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
          "concreteType": "ComparisonSnapshotEvidence",
          "kind": "LinkedField",
          "name": "evidence",
          "plural": true,
          "selections": [
            {
              "alias": null,
              "args": null,
              "kind": "ScalarField",
              "name": "sourceName",
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
      "concreteType": "ComparisonSnapshotOffer",
      "kind": "LinkedField",
      "name": "offers",
      "plural": true,
      "selections": [
        {
          "alias": null,
          "args": null,
          "kind": "ScalarField",
          "name": "pricePointId",
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
          "name": "observedAt",
          "storageKey": null
        }
      ],
      "storageKey": null
    }
  ],
  "storageKey": null
},
v9 = {
  "alias": null,
  "args": null,
  "concreteType": "ComparisonRecommendation",
  "kind": "LinkedField",
  "name": "recommendation",
  "plural": false,
  "selections": [
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "evaluatedAt",
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "winnerProductId",
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "missingInputs",
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "concreteType": "RecommendationRanking",
      "kind": "LinkedField",
      "name": "rankings",
      "plural": true,
      "selections": [
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
          "name": "productName",
          "storageKey": null
        },
        {
          "alias": null,
          "args": null,
          "kind": "ScalarField",
          "name": "reasons",
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
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Fragment",
    "metadata": null,
    "name": "SharedComparisonRouteQuery",
    "selections": [
      {
        "alias": null,
        "args": (v1/*: any*/),
        "concreteType": "ComparisonSnapshot",
        "kind": "LinkedField",
        "name": "comparisonSnapshot",
        "plural": false,
        "selections": [
          (v2/*: any*/),
          (v4/*: any*/),
          (v5/*: any*/),
          (v6/*: any*/),
          (v8/*: any*/),
          (v9/*: any*/)
        ],
        "storageKey": null
      }
    ],
    "type": "RootQueryType",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "SharedComparisonRouteQuery",
    "selections": [
      {
        "alias": null,
        "args": (v1/*: any*/),
        "concreteType": "ComparisonSnapshot",
        "kind": "LinkedField",
        "name": "comparisonSnapshot",
        "plural": false,
        "selections": [
          (v2/*: any*/),
          (v4/*: any*/),
          (v5/*: any*/),
          (v6/*: any*/),
          (v8/*: any*/),
          (v9/*: any*/),
          (v7/*: any*/)
        ],
        "storageKey": null
      }
    ]
  },
  "params": {
    "cacheID": "9406590923f8d31aa9f754b609b96464",
    "id": null,
    "metadata": {},
    "name": "SharedComparisonRouteQuery",
    "operationKind": "query",
    "text": "query SharedComparisonRouteQuery(\n  $token: String!\n) {\n  comparisonSnapshot(token: $token) {\n    title\n    seo {\n      title\n      description\n      canonicalPath\n      indexable\n      imageUrl\n      structuredData\n    }\n    capturedAt\n    disclaimer\n    products {\n      id\n      name\n      slug\n      description\n      modelNumber\n      brandName\n      attributes {\n        claimId\n        displayName\n        valueText\n        evidence {\n          sourceName\n        }\n      }\n      offers {\n        pricePointId\n        merchantName\n        currency\n        landedPrice\n        observedAt\n      }\n    }\n    recommendation {\n      evaluatedAt\n      winnerProductId\n      missingInputs\n      rankings {\n        productId\n        productName\n        reasons\n      }\n    }\n    id\n  }\n}\n"
  }
};
})();

(node as any).hash = "1f9c6809e8cc25b1c38692d5094c033d";

export default node;

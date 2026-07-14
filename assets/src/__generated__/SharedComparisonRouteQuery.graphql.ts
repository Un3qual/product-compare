/**
 * @generated SignedSource<<a45f04110d1c078bb9f392e4fbdcac3c>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type RecommendationProfile = "BEST_VALUE" | "LOWEST_CURRENT_COST" | "%future added value";
export type RecommendationStatus = "INSUFFICIENT_EVIDENCE" | "TIE" | "WINNER" | "%future added value";
export type SharedComparisonRouteQuery$variables = {
  token: string;
};
export type SharedComparisonRouteQuery$data = {
  readonly comparisonSnapshot: {
    readonly capturedAt: any;
    readonly disclaimer: string;
    readonly id: string;
    readonly products: ReadonlyArray<{
      readonly attributes: ReadonlyArray<{
        readonly claimId: string;
        readonly displayName: string;
        readonly evidence: ReadonlyArray<{
          readonly artifactId: string;
          readonly excerpt: string | null | undefined;
          readonly fetchedAt: any;
          readonly sourceDomain: string | null | undefined;
          readonly sourceName: string;
          readonly url: string | null | undefined;
        }>;
        readonly sourceType: string;
        readonly valueText: string;
      }>;
      readonly brandName: string | null | undefined;
      readonly description: string | null | undefined;
      readonly id: string;
      readonly modelNumber: string | null | undefined;
      readonly name: string;
      readonly offers: ReadonlyArray<{
        readonly currency: string;
        readonly freshness: string;
        readonly itemPrice: any;
        readonly landedPrice: any;
        readonly merchantDomain: string | null | undefined;
        readonly merchantName: string;
        readonly merchantProductId: string;
        readonly observedAt: any;
        readonly pricePointId: string;
        readonly shipping: any;
      }>;
      readonly slug: string;
    }>;
    readonly recommendation: {
      readonly algorithmVersion: string;
      readonly currency: string | null | undefined;
      readonly evaluatedAt: any;
      readonly missingInputs: ReadonlyArray<string>;
      readonly profile: RecommendationProfile;
      readonly rankings: ReadonlyArray<{
        readonly claimIds: ReadonlyArray<string>;
        readonly currency: string;
        readonly landedPrice: any;
        readonly pricePointId: string;
        readonly productId: string;
        readonly productName: string;
        readonly rank: number;
        readonly reasons: ReadonlyArray<string>;
      }>;
      readonly status: RecommendationStatus;
      readonly winnerProductId: string | null | undefined;
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
  "name": "pricePointId",
  "storageKey": null
},
v3 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "currency",
  "storageKey": null
},
v4 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "landedPrice",
  "storageKey": null
},
v5 = [
  {
    "alias": null,
    "args": [
      {
        "kind": "Variable",
        "name": "token",
        "variableName": "token"
      }
    ],
    "concreteType": "ComparisonSnapshot",
    "kind": "LinkedField",
    "name": "comparisonSnapshot",
    "plural": false,
    "selections": [
      (v1/*: any*/),
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "title",
        "storageKey": null
      },
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "capturedAt",
        "storageKey": null
      },
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "disclaimer",
        "storageKey": null
      },
      {
        "alias": null,
        "args": null,
        "concreteType": "ComparisonSnapshotProduct",
        "kind": "LinkedField",
        "name": "products",
        "plural": true,
        "selections": [
          (v1/*: any*/),
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
                "kind": "ScalarField",
                "name": "sourceType",
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
                    "name": "artifactId",
                    "storageKey": null
                  },
                  {
                    "alias": null,
                    "args": null,
                    "kind": "ScalarField",
                    "name": "excerpt",
                    "storageKey": null
                  },
                  {
                    "alias": null,
                    "args": null,
                    "kind": "ScalarField",
                    "name": "sourceName",
                    "storageKey": null
                  },
                  {
                    "alias": null,
                    "args": null,
                    "kind": "ScalarField",
                    "name": "sourceDomain",
                    "storageKey": null
                  },
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
                    "name": "fetchedAt",
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
              (v2/*: any*/),
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "merchantProductId",
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
                "name": "merchantDomain",
                "storageKey": null
              },
              (v3/*: any*/),
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "itemPrice",
                "storageKey": null
              },
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "shipping",
                "storageKey": null
              },
              (v4/*: any*/),
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
                "name": "freshness",
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
        "concreteType": "SnapshotRecommendation",
        "kind": "LinkedField",
        "name": "recommendation",
        "plural": false,
        "selections": [
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "profile",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "algorithmVersion",
            "storageKey": null
          },
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
            "name": "status",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "winnerProductId",
            "storageKey": null
          },
          (v3/*: any*/),
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
            "concreteType": "SnapshotRecommendationRanking",
            "kind": "LinkedField",
            "name": "rankings",
            "plural": true,
            "selections": [
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "rank",
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
                "name": "productName",
                "storageKey": null
              },
              (v4/*: any*/),
              (v3/*: any*/),
              (v2/*: any*/),
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "claimIds",
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
    "name": "SharedComparisonRouteQuery",
    "selections": (v5/*: any*/),
    "type": "RootQueryType",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "SharedComparisonRouteQuery",
    "selections": (v5/*: any*/)
  },
  "params": {
    "cacheID": "b7ca840c7f7804088dc1e1da93ce5db6",
    "id": null,
    "metadata": {},
    "name": "SharedComparisonRouteQuery",
    "operationKind": "query",
    "text": "query SharedComparisonRouteQuery(\n  $token: String!\n) {\n  comparisonSnapshot(token: $token) {\n    id\n    title\n    capturedAt\n    disclaimer\n    products {\n      id\n      name\n      slug\n      description\n      modelNumber\n      brandName\n      attributes {\n        claimId\n        displayName\n        valueText\n        sourceType\n        evidence {\n          artifactId\n          excerpt\n          sourceName\n          sourceDomain\n          url\n          fetchedAt\n        }\n      }\n      offers {\n        pricePointId\n        merchantProductId\n        merchantName\n        merchantDomain\n        currency\n        itemPrice\n        shipping\n        landedPrice\n        observedAt\n        freshness\n      }\n    }\n    recommendation {\n      profile\n      algorithmVersion\n      evaluatedAt\n      status\n      winnerProductId\n      currency\n      missingInputs\n      rankings {\n        rank\n        productId\n        productName\n        landedPrice\n        currency\n        pricePointId\n        claimIds\n        reasons\n      }\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "62b1287ab6747299aedc6dba8351aa5b";

export default node;

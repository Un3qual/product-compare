/**
 * @generated SignedSource<<1fcf450288db6f64c6d294a450ed1f66>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type RecommendationProfile = "BEST_VALUE" | "LOWEST_CURRENT_COST" | "%future added value";
export type RecommendationStatus = "INSUFFICIENT_EVIDENCE" | "TIE" | "WINNER" | "%future added value";
export type RecommendationPanelQuery$variables = {
  profile: RecommendationProfile;
  slugs: ReadonlyArray<string>;
};
export type RecommendationPanelQuery$data = {
  readonly comparisonRecommendation: {
    readonly algorithmVersion: string;
    readonly currency: string | null | undefined;
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
};
export type RecommendationPanelQuery = {
  response: RecommendationPanelQuery$data;
  variables: RecommendationPanelQuery$variables;
};

const node: ConcreteRequest = (function(){
var v0 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "profile"
},
v1 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "slugs"
},
v2 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "currency",
  "storageKey": null
},
v3 = [
  {
    "alias": null,
    "args": [
      {
        "kind": "Variable",
        "name": "profile",
        "variableName": "profile"
      },
      {
        "kind": "Variable",
        "name": "slugs",
        "variableName": "slugs"
      }
    ],
    "concreteType": "ComparisonRecommendation",
    "kind": "LinkedField",
    "name": "comparisonRecommendation",
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
      (v2/*: any*/),
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
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "landedPrice",
            "storageKey": null
          },
          (v2/*: any*/),
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
];
return {
  "fragment": {
    "argumentDefinitions": [
      (v0/*: any*/),
      (v1/*: any*/)
    ],
    "kind": "Fragment",
    "metadata": null,
    "name": "RecommendationPanelQuery",
    "selections": (v3/*: any*/),
    "type": "RootQueryType",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": [
      (v1/*: any*/),
      (v0/*: any*/)
    ],
    "kind": "Operation",
    "name": "RecommendationPanelQuery",
    "selections": (v3/*: any*/)
  },
  "params": {
    "cacheID": "82ea9cc4e19c244e65f1d2561492ac2f",
    "id": null,
    "metadata": {},
    "name": "RecommendationPanelQuery",
    "operationKind": "query",
    "text": "query RecommendationPanelQuery(\n  $slugs: [String!]!\n  $profile: RecommendationProfile!\n) {\n  comparisonRecommendation(slugs: $slugs, profile: $profile) {\n    profile\n    algorithmVersion\n    status\n    winnerProductId\n    currency\n    missingInputs\n    rankings {\n      rank\n      productId\n      productName\n      landedPrice\n      currency\n      pricePointId\n      claimIds\n      reasons\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "4e77bf545d969ddd3f42829c7ea21786";

export default node;

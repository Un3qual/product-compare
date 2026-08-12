/**
 * @generated SignedSource<<520b7a9271f8ef16dd61ada44e227384>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type RecommendationProfile = "BEST_VALUE" | "LOWEST_CURRENT_COST" | "%future added value";
export type RecommendationPanelQuery$variables = {
  profile: RecommendationProfile;
  slugs: ReadonlyArray<string>;
};
export type RecommendationPanelQuery$data = {
  readonly comparisonRecommendation: {
    readonly missingInputs: ReadonlyArray<string>;
    readonly rankings: ReadonlyArray<{
      readonly claimIds: ReadonlyArray<string>;
      readonly productId: string;
      readonly productName: string;
      readonly reasons: ReadonlyArray<string>;
    }>;
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
v2 = [
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
    "selections": (v2/*: any*/),
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
    "selections": (v2/*: any*/)
  },
  "params": {
    "cacheID": "24fc2311008e2cf794ae7c78c437b1f5",
    "id": null,
    "metadata": {},
    "name": "RecommendationPanelQuery",
    "operationKind": "query",
    "text": "query RecommendationPanelQuery(\n  $slugs: [String!]!\n  $profile: RecommendationProfile!\n) {\n  comparisonRecommendation(slugs: $slugs, profile: $profile) {\n    winnerProductId\n    missingInputs\n    rankings {\n      productId\n      productName\n      claimIds\n      reasons\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "a89a7653fd5d3a3872eb56cbc35d5975";

export default node;

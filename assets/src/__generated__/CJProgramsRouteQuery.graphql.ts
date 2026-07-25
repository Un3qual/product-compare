/**
 * @generated SignedSource<<36cace94bfdd01b2f6660118c5e04c8e>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type CJProgramSort = "FEED_COUNT_DESC" | "LAST_CHANGED_DESC" | "NAME_ASC" | "%future added value";
export type CJProgramStage = "ACCEPTED" | "APPLIED" | "CONSIDERING" | "DECLINED" | "NEW" | "NOT_PURSUING" | "SELECTED" | "%future added value";
export type CJProgramWarningCode = "MISSING_ADVERTISER_NAME" | "MISSING_PRODUCT_COUNT" | "NON_ENGLISH_LANGUAGE" | "NON_USD_CURRENCY" | "NON_US_MARKET" | "%future added value";
export type CJProgramsRouteQuery$variables = {
  after?: string | null | undefined;
  first: number;
  sort: CJProgramSort;
  stage?: CJProgramStage | null | undefined;
  unmatchedAfter?: string | null | undefined;
  unmatchedFirst: number;
};
export type CJProgramsRouteQuery$data = {
  readonly cjProgramStageCounts: {
    readonly accepted: number;
    readonly applied: number;
    readonly considering: number;
    readonly declined: number;
    readonly new: number;
    readonly notPursuing: number;
    readonly selected: number;
  };
  readonly cjPrograms: {
    readonly edges: ReadonlyArray<{
      readonly cursor: string;
      readonly node: {
        readonly advertiserId: string;
        readonly advertiserName: string | null | undefined;
        readonly feedCount: number | null | undefined;
        readonly id: string;
        readonly lastChanged: any;
        readonly note: string | null | undefined;
        readonly stage: CJProgramStage;
        readonly warningCodes: ReadonlyArray<CJProgramWarningCode>;
      };
    }>;
    readonly pageInfo: {
      readonly endCursor: string | null | undefined;
      readonly hasNextPage: boolean;
      readonly hasPreviousPage: boolean;
    };
  };
  readonly unmatchedCjFeeds: {
    readonly edges: ReadonlyArray<{
      readonly cursor: string;
      readonly node: {
        readonly advertiserCountry: string | null | undefined;
        readonly advertiserId: string | null | undefined;
        readonly advertiserName: string | null | undefined;
        readonly currency: string | null | undefined;
        readonly feedName: string | null | undefined;
        readonly id: string;
        readonly language: string | null | undefined;
        readonly lastSeenAt: any;
        readonly productCount: number | null | undefined;
        readonly provider: string;
        readonly providerFeedId: string;
        readonly providerLastUpdatedAt: any | null | undefined;
        readonly sourceFeedType: string | null | undefined;
      };
    }>;
    readonly pageInfo: {
      readonly endCursor: string | null | undefined;
      readonly hasNextPage: boolean;
      readonly hasPreviousPage: boolean;
    };
  };
};
export type CJProgramsRouteQuery = {
  response: CJProgramsRouteQuery$data;
  variables: CJProgramsRouteQuery$variables;
};

const node: ConcreteRequest = (function(){
var v0 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "after"
},
v1 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "first"
},
v2 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "sort"
},
v3 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "stage"
},
v4 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "unmatchedAfter"
},
v5 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "unmatchedFirst"
},
v6 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "cursor",
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
  "kind": "ScalarField",
  "name": "advertiserId",
  "storageKey": null
},
v9 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "advertiserName",
  "storageKey": null
},
v10 = {
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
    },
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "hasPreviousPage",
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "endCursor",
      "storageKey": null
    }
  ],
  "storageKey": null
},
v11 = [
  {
    "alias": null,
    "args": null,
    "concreteType": "CJProgramStageCounts",
    "kind": "LinkedField",
    "name": "cjProgramStageCounts",
    "plural": false,
    "selections": [
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "new",
        "storageKey": null
      },
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "considering",
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
        "name": "applied",
        "storageKey": null
      },
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "accepted",
        "storageKey": null
      },
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "notPursuing",
        "storageKey": null
      },
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "declined",
        "storageKey": null
      }
    ],
    "storageKey": null
  },
  {
    "alias": null,
    "args": [
      {
        "kind": "Variable",
        "name": "after",
        "variableName": "after"
      },
      {
        "kind": "Variable",
        "name": "first",
        "variableName": "first"
      },
      {
        "kind": "Variable",
        "name": "sort",
        "variableName": "sort"
      },
      {
        "kind": "Variable",
        "name": "stage",
        "variableName": "stage"
      }
    ],
    "concreteType": "CJProgramConnection",
    "kind": "LinkedField",
    "name": "cjPrograms",
    "plural": false,
    "selections": [
      {
        "alias": null,
        "args": null,
        "concreteType": "CJProgramEdge",
        "kind": "LinkedField",
        "name": "edges",
        "plural": true,
        "selections": [
          (v6/*: any*/),
          {
            "alias": null,
            "args": null,
            "concreteType": "CJProgram",
            "kind": "LinkedField",
            "name": "node",
            "plural": false,
            "selections": [
              (v7/*: any*/),
              (v8/*: any*/),
              (v9/*: any*/),
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "stage",
                "storageKey": null
              },
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "note",
                "storageKey": null
              },
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "lastChanged",
                "storageKey": null
              },
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "feedCount",
                "storageKey": null
              },
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "warningCodes",
                "storageKey": null
              }
            ],
            "storageKey": null
          }
        ],
        "storageKey": null
      },
      (v10/*: any*/)
    ],
    "storageKey": null
  },
  {
    "alias": null,
    "args": [
      {
        "kind": "Variable",
        "name": "after",
        "variableName": "unmatchedAfter"
      },
      {
        "kind": "Variable",
        "name": "first",
        "variableName": "unmatchedFirst"
      }
    ],
    "concreteType": "MerchantFeedCandidateConnection",
    "kind": "LinkedField",
    "name": "unmatchedCjFeeds",
    "plural": false,
    "selections": [
      {
        "alias": null,
        "args": null,
        "concreteType": "MerchantFeedCandidateEdge",
        "kind": "LinkedField",
        "name": "edges",
        "plural": true,
        "selections": [
          (v6/*: any*/),
          {
            "alias": null,
            "args": null,
            "concreteType": "MerchantFeedCandidate",
            "kind": "LinkedField",
            "name": "node",
            "plural": false,
            "selections": [
              (v7/*: any*/),
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "provider",
                "storageKey": null
              },
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "providerFeedId",
                "storageKey": null
              },
              (v8/*: any*/),
              (v9/*: any*/),
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "advertiserCountry",
                "storageKey": null
              },
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "sourceFeedType",
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
                "name": "language",
                "storageKey": null
              },
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "feedName",
                "storageKey": null
              },
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "productCount",
                "storageKey": null
              },
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "providerLastUpdatedAt",
                "storageKey": null
              },
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "lastSeenAt",
                "storageKey": null
              }
            ],
            "storageKey": null
          }
        ],
        "storageKey": null
      },
      (v10/*: any*/)
    ],
    "storageKey": null
  }
];
return {
  "fragment": {
    "argumentDefinitions": [
      (v0/*: any*/),
      (v1/*: any*/),
      (v2/*: any*/),
      (v3/*: any*/),
      (v4/*: any*/),
      (v5/*: any*/)
    ],
    "kind": "Fragment",
    "metadata": null,
    "name": "CJProgramsRouteQuery",
    "selections": (v11/*: any*/),
    "type": "RootQueryType",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": [
      (v1/*: any*/),
      (v0/*: any*/),
      (v3/*: any*/),
      (v2/*: any*/),
      (v5/*: any*/),
      (v4/*: any*/)
    ],
    "kind": "Operation",
    "name": "CJProgramsRouteQuery",
    "selections": (v11/*: any*/)
  },
  "params": {
    "cacheID": "bdcc8fd8ae13c962a3d2d48f9980687b",
    "id": null,
    "metadata": {},
    "name": "CJProgramsRouteQuery",
    "operationKind": "query",
    "text": "query CJProgramsRouteQuery(\n  $first: Int!\n  $after: String\n  $stage: CJProgramStage\n  $sort: CJProgramSort!\n  $unmatchedFirst: Int!\n  $unmatchedAfter: String\n) {\n  cjProgramStageCounts {\n    new\n    considering\n    selected\n    applied\n    accepted\n    notPursuing\n    declined\n  }\n  cjPrograms(first: $first, after: $after, stage: $stage, sort: $sort) {\n    edges {\n      cursor\n      node {\n        id\n        advertiserId\n        advertiserName\n        stage\n        note\n        lastChanged\n        feedCount\n        warningCodes\n      }\n    }\n    pageInfo {\n      hasNextPage\n      hasPreviousPage\n      endCursor\n    }\n  }\n  unmatchedCjFeeds(first: $unmatchedFirst, after: $unmatchedAfter) {\n    edges {\n      cursor\n      node {\n        id\n        provider\n        providerFeedId\n        advertiserId\n        advertiserName\n        advertiserCountry\n        sourceFeedType\n        currency\n        language\n        feedName\n        productCount\n        providerLastUpdatedAt\n        lastSeenAt\n      }\n    }\n    pageInfo {\n      hasNextPage\n      hasPreviousPage\n      endCursor\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "f11f9b9ffcc6d1eb4a3f08894a637b0a";

export default node;

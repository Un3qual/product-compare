/**
 * @generated SignedSource<<8a05efb748302c593963d97f8ff05572>>
 * @lightSyntaxTransform
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
import { FragmentRefs } from "relay-runtime";
export type CJProgramSort = "FEED_COUNT_DESC" | "LAST_CHANGED_DESC" | "NAME_ASC" | "%future added value";
export type CJProgramStage = "ACCEPTED" | "APPLIED" | "CONSIDERING" | "DECLINED" | "NEW" | "NOT_PURSUING" | "SELECTED" | "%future added value";
export type CJProgramWarningCode = "MISSING_ADVERTISER_NAME" | "MISSING_PRODUCT_COUNT" | "NON_ENGLISH_LANGUAGE" | "NON_USD_CURRENCY" | "NON_US_MARKET" | "%future added value";
export type CJProgramsRouteQuery$variables = {
  after?: string | null;
  first: number;
  sort: CJProgramSort;
  stage?: CJProgramStage | null;
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
      readonly node: {
        readonly advertiserId: string;
        readonly advertiserName: string | null;
        readonly id: string;
        readonly stage: CJProgramStage;
        readonly warningCodes: ReadonlyArray<CJProgramWarningCode>;
        readonly " $fragmentSpreads": FragmentRefs<"ProgramLifecycleRow_program">;
      };
    }>;
    readonly pageInfo: {
      readonly endCursor: string | null;
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
v5 = [
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
v6 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "id",
  "storageKey": null
},
v7 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "advertiserId",
  "storageKey": null
},
v8 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "advertiserName",
  "storageKey": null
},
v9 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "stage",
  "storageKey": null
},
v10 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "warningCodes",
  "storageKey": null
},
v11 = {
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
};
return {
  "fragment": {
    "argumentDefinitions": [
      (v0/*:: as any*/),
      (v1/*:: as any*/),
      (v2/*:: as any*/),
      (v3/*:: as any*/)
    ],
    "kind": "Fragment",
    "metadata": null,
    "name": "CJProgramsRouteQuery",
    "selections": [
      (v4/*:: as any*/),
      {
        "alias": null,
        "args": (v5/*:: as any*/),
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
              {
                "alias": null,
                "args": null,
                "concreteType": "CJProgram",
                "kind": "LinkedField",
                "name": "node",
                "plural": false,
                "selections": [
                  (v6/*:: as any*/),
                  (v7/*:: as any*/),
                  (v8/*:: as any*/),
                  (v9/*:: as any*/),
                  (v10/*:: as any*/),
                  {
                    "args": null,
                    "kind": "FragmentSpread",
                    "name": "ProgramLifecycleRow_program"
                  }
                ],
                "storageKey": null
              }
            ],
            "storageKey": null
          },
          (v11/*:: as any*/)
        ],
        "storageKey": null
      }
    ],
    "type": "RootQueryType",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": [
      (v1/*:: as any*/),
      (v0/*:: as any*/),
      (v3/*:: as any*/),
      (v2/*:: as any*/)
    ],
    "kind": "Operation",
    "name": "CJProgramsRouteQuery",
    "selections": [
      (v4/*:: as any*/),
      {
        "alias": null,
        "args": (v5/*:: as any*/),
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
              {
                "alias": null,
                "args": null,
                "concreteType": "CJProgram",
                "kind": "LinkedField",
                "name": "node",
                "plural": false,
                "selections": [
                  (v6/*:: as any*/),
                  (v7/*:: as any*/),
                  (v8/*:: as any*/),
                  (v9/*:: as any*/),
                  (v10/*:: as any*/),
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
                  }
                ],
                "storageKey": null
              }
            ],
            "storageKey": null
          },
          (v11/*:: as any*/)
        ],
        "storageKey": null
      }
    ]
  },
  "params": {
    "cacheID": "0fce2ddf2826f4d6e9aa889e6f55359a",
    "id": null,
    "metadata": {},
    "name": "CJProgramsRouteQuery",
    "operationKind": "query",
    "text": "query CJProgramsRouteQuery(\n  $first: Int!\n  $after: String\n  $stage: CJProgramStage\n  $sort: CJProgramSort!\n) {\n  cjProgramStageCounts {\n    new\n    considering\n    selected\n    applied\n    accepted\n    notPursuing\n    declined\n  }\n  cjPrograms(first: $first, after: $after, stage: $stage, sort: $sort) {\n    edges {\n      node {\n        id\n        advertiserId\n        advertiserName\n        stage\n        warningCodes\n        ...ProgramLifecycleRow_program\n      }\n    }\n    pageInfo {\n      hasNextPage\n      hasPreviousPage\n      endCursor\n    }\n  }\n}\n\nfragment ProgramLifecycleRow_program on CJProgram {\n  id\n  advertiserId\n  advertiserName\n  stage\n  note\n  lastChanged\n  feedCount\n  warningCodes\n}\n"
  }
};
})();

(node as any).hash = "d467f3ab069fcceeca964d43b0e912b5";

export default node;

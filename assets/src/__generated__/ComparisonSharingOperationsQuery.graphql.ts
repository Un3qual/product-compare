/**
 * @generated SignedSource<<f019fdfce947e24910f35f08cfcc7857>>
 * @lightSyntaxTransform
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
import { FragmentRefs } from "relay-runtime";
export type ComparisonSharingOperationsQuery$variables = {
  after?: string | null;
  first: number;
};
export type ComparisonSharingOperationsQuery$data = {
  readonly " $fragmentSpreads": FragmentRefs<"ComparisonSharingOperations_snapshots">;
};
export type ComparisonSharingOperationsQuery = {
  response: ComparisonSharingOperationsQuery$data;
  variables: ComparisonSharingOperationsQuery$variables;
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
v2 = [
  {
    "kind": "Variable",
    "name": "after",
    "variableName": "after"
  },
  {
    "kind": "Variable",
    "name": "first",
    "variableName": "first"
  }
],
v3 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "id",
  "storageKey": null
};
return {
  "fragment": {
    "argumentDefinitions": [
      (v0/*:: as any*/),
      (v1/*:: as any*/)
    ],
    "kind": "Fragment",
    "metadata": null,
    "name": "ComparisonSharingOperationsQuery",
    "selections": [
      {
        "args": (v2/*:: as any*/),
        "kind": "FragmentSpread",
        "name": "ComparisonSharingOperations_snapshots"
      }
    ],
    "type": "RootQueryType",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": [
      (v1/*:: as any*/),
      (v0/*:: as any*/)
    ],
    "kind": "Operation",
    "name": "ComparisonSharingOperationsQuery",
    "selections": [
      {
        "alias": null,
        "args": null,
        "concreteType": "User",
        "kind": "LinkedField",
        "name": "viewer",
        "plural": false,
        "selections": [
          {
            "alias": null,
            "args": (v2/*:: as any*/),
            "concreteType": "ComparisonSnapshotConnection",
            "kind": "LinkedField",
            "name": "comparisonSnapshots",
            "plural": false,
            "selections": [
              {
                "alias": null,
                "args": null,
                "concreteType": "ComparisonSnapshotEdge",
                "kind": "LinkedField",
                "name": "edges",
                "plural": true,
                "selections": [
                  {
                    "alias": null,
                    "args": null,
                    "concreteType": "ComparisonSnapshot",
                    "kind": "LinkedField",
                    "name": "node",
                    "plural": false,
                    "selections": [
                      (v3/*:: as any*/),
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
                        "name": "sharePath",
                        "storageKey": null
                      },
                      {
                        "alias": null,
                        "args": null,
                        "kind": "ScalarField",
                        "name": "__typename",
                        "storageKey": null
                      }
                    ],
                    "storageKey": null
                  },
                  {
                    "alias": null,
                    "args": null,
                    "kind": "ScalarField",
                    "name": "cursor",
                    "storageKey": null
                  }
                ],
                "storageKey": null
              },
              {
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
                    "name": "endCursor",
                    "storageKey": null
                  },
                  {
                    "alias": null,
                    "args": null,
                    "kind": "ScalarField",
                    "name": "hasNextPage",
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
            "args": (v2/*:: as any*/),
            "filters": null,
            "handle": "connection",
            "key": "ComparisonSharingOperations_comparisonSnapshots",
            "kind": "LinkedHandle",
            "name": "comparisonSnapshots"
          },
          (v3/*:: as any*/)
        ],
        "storageKey": null
      }
    ]
  },
  "params": {
    "cacheID": "581ecde67269bb1a6eea231f13d6aa5d",
    "id": null,
    "metadata": {},
    "name": "ComparisonSharingOperationsQuery",
    "operationKind": "query",
    "text": "query ComparisonSharingOperationsQuery(\n  $first: Int!\n  $after: String\n) {\n  ...ComparisonSharingOperations_snapshots_2HEEH6\n}\n\nfragment ComparisonSharingOperations_snapshots_2HEEH6 on RootQueryType {\n  viewer {\n    comparisonSnapshots(first: $first, after: $after) {\n      edges {\n        node {\n          id\n          title\n          sharePath\n          __typename\n        }\n        cursor\n      }\n      pageInfo {\n        endCursor\n        hasNextPage\n      }\n    }\n    id\n  }\n}\n"
  }
};
})();

(node as any).hash = "7aad6d8be01d525960f5fbb8c39a8c44";

export default node;

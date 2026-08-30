/**
 * @generated SignedSource<<861a59cb244149498a980aedd5fdfe10>>
 * @lightSyntaxTransform
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
import { FragmentRefs } from "relay-runtime";
export type ComparisonSharingSnapshotsPaginationQuery$variables = {
  after?: string | null;
  first: number;
};
export type ComparisonSharingSnapshotsPaginationQuery$data = {
  readonly " $fragmentSpreads": FragmentRefs<"ComparisonSharingOperations_snapshots">;
};
export type ComparisonSharingSnapshotsPaginationQuery = {
  response: ComparisonSharingSnapshotsPaginationQuery$data;
  variables: ComparisonSharingSnapshotsPaginationQuery$variables;
};

const node: ConcreteRequest = (function(){
var v0 = [
  {
    "defaultValue": null,
    "kind": "LocalArgument",
    "name": "after"
  },
  {
    "defaultValue": null,
    "kind": "LocalArgument",
    "name": "first"
  }
],
v1 = [
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
v2 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "id",
  "storageKey": null
};
return {
  "fragment": {
    "argumentDefinitions": (v0/*:: as any*/),
    "kind": "Fragment",
    "metadata": null,
    "name": "ComparisonSharingSnapshotsPaginationQuery",
    "selections": [
      {
        "args": (v1/*:: as any*/),
        "kind": "FragmentSpread",
        "name": "ComparisonSharingOperations_snapshots"
      }
    ],
    "type": "RootQueryType",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*:: as any*/),
    "kind": "Operation",
    "name": "ComparisonSharingSnapshotsPaginationQuery",
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
            "args": (v1/*:: as any*/),
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
                      (v2/*:: as any*/),
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
            "args": (v1/*:: as any*/),
            "filters": null,
            "handle": "connection",
            "key": "ComparisonSharingOperations_comparisonSnapshots",
            "kind": "LinkedHandle",
            "name": "comparisonSnapshots"
          },
          (v2/*:: as any*/)
        ],
        "storageKey": null
      }
    ]
  },
  "params": {
    "cacheID": "1cc4476d85b3d84e87a8a1954787a177",
    "id": null,
    "metadata": {},
    "name": "ComparisonSharingSnapshotsPaginationQuery",
    "operationKind": "query",
    "text": "query ComparisonSharingSnapshotsPaginationQuery(\n  $after: String\n  $first: Int!\n) {\n  ...ComparisonSharingOperations_snapshots_2HEEH6\n}\n\nfragment ComparisonSharingOperations_snapshots_2HEEH6 on RootQueryType {\n  viewer {\n    comparisonSnapshots(first: $first, after: $after) {\n      edges {\n        node {\n          id\n          title\n          sharePath\n          __typename\n        }\n        cursor\n      }\n      pageInfo {\n        endCursor\n        hasNextPage\n      }\n    }\n    id\n  }\n}\n"
  }
};
})();

(node as any).hash = "ba502c0e0bf2bcc3b5761aa2a1a9bef1";

export default node;

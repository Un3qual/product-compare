/**
 * @generated SignedSource<<3df2798d13df83f8b21c75ea16cfa77d>>
 * @lightSyntaxTransform
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ReaderFragment } from 'relay-runtime';
import { FragmentRefs } from "relay-runtime";
export type ComparisonSharingOperations_snapshots$data = {
  readonly viewer: {
    readonly comparisonSnapshots: {
      readonly edges: ReadonlyArray<{
        readonly node: {
          readonly id: string;
          readonly sharePath: string;
          readonly title: string | null;
        };
      }>;
    };
  } | null;
  readonly " $fragmentType": "ComparisonSharingOperations_snapshots";
};
export type ComparisonSharingOperations_snapshots$key = {
  readonly " $data"?: ComparisonSharingOperations_snapshots$data;
  readonly " $fragmentSpreads": FragmentRefs<"ComparisonSharingOperations_snapshots">;
};

import ComparisonSharingSnapshotsPaginationQuery_graphql from './ComparisonSharingSnapshotsPaginationQuery.graphql';

const node: ReaderFragment = (function(){
var v0 = [
  "viewer",
  "comparisonSnapshots"
];
return {
  "argumentDefinitions": [
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
  "kind": "Fragment",
  "metadata": {
    "connection": [
      {
        "count": "first",
        "cursor": "after",
        "direction": "forward",
        "path": (v0/*:: as any*/)
      }
    ],
    "refetch": {
      "connection": {
        "forward": {
          "count": "first",
          "cursor": "after"
        },
        "backward": null,
        "path": (v0/*:: as any*/)
      },
      "fragmentPathInResult": [],
      "operation": ComparisonSharingSnapshotsPaginationQuery_graphql
    }
  },
  "name": "ComparisonSharingOperations_snapshots",
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
          "alias": "comparisonSnapshots",
          "args": null,
          "concreteType": "ComparisonSnapshotConnection",
          "kind": "LinkedField",
          "name": "__ComparisonSharingOperations_comparisonSnapshots_connection",
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
                    {
                      "alias": null,
                      "args": null,
                      "kind": "ScalarField",
                      "name": "id",
                      "storageKey": null
                    },
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
        }
      ],
      "storageKey": null
    }
  ],
  "type": "RootQueryType",
  "abstractKey": null
};
})();

(node as any).hash = "ba502c0e0bf2bcc3b5761aa2a1a9bef1";

export default node;

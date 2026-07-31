/**
 * @generated SignedSource<<e2dbdcc2996849da52b4474b9b09bda7>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type ComparisonSharingOperationsQuery$variables = {
  after?: string | null | undefined;
  first: number;
};
export type ComparisonSharingOperationsQuery$data = {
  readonly viewer: {
    readonly comparisonSnapshots: {
      readonly edges: ReadonlyArray<{
        readonly node: {
          readonly id: string;
          readonly sharePath: string;
          readonly title: string | null | undefined;
        };
      }>;
      readonly pageInfo: {
        readonly endCursor: string | null | undefined;
        readonly hasNextPage: boolean;
      };
    };
  } | null | undefined;
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
v2 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "id",
  "storageKey": null
},
v3 = {
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
    }
  ],
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
            (v2/*: any*/),
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
};
return {
  "fragment": {
    "argumentDefinitions": [
      (v0/*: any*/),
      (v1/*: any*/)
    ],
    "kind": "Fragment",
    "metadata": null,
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
          (v3/*: any*/)
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
      (v1/*: any*/),
      (v0/*: any*/)
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
          (v3/*: any*/),
          (v2/*: any*/)
        ],
        "storageKey": null
      }
    ]
  },
  "params": {
    "cacheID": "e50e0b8979ae4fdb12385ac3e27ce311",
    "id": null,
    "metadata": {},
    "name": "ComparisonSharingOperationsQuery",
    "operationKind": "query",
    "text": "query ComparisonSharingOperationsQuery(\n  $first: Int!\n  $after: String\n) {\n  viewer {\n    comparisonSnapshots(first: $first, after: $after) {\n      edges {\n        node {\n          id\n          title\n          sharePath\n        }\n      }\n      pageInfo {\n        endCursor\n        hasNextPage\n      }\n    }\n    id\n  }\n}\n"
  }
};
})();

(node as any).hash = "a1c6dcb36f31789f5b0f624f8546c6e9";

export default node;

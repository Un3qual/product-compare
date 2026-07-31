/**
 * @generated SignedSource<<3a455059a732a24d6a928b204eb3fbc4>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type RecommendationProfile = "BEST_VALUE" | "LOWEST_CURRENT_COST" | "%future added value";
export type PublishComparisonSnapshotInput = {
  productIds: ReadonlyArray<string>;
  recommendationProfile: RecommendationProfile;
  searchIndexable?: boolean | null | undefined;
  title?: string | null | undefined;
};
export type ComparisonSharingOperationsPublishComparisonSnapshotMutation$variables = {
  input: PublishComparisonSnapshotInput;
};
export type ComparisonSharingOperationsPublishComparisonSnapshotMutation$data = {
  readonly publishComparisonSnapshot: {
    readonly errors: ReadonlyArray<{
      readonly code: string;
      readonly field: string | null | undefined;
      readonly message: string;
    }>;
    readonly sharePath: string | null | undefined;
    readonly snapshot: {
      readonly capturedAt: any;
      readonly id: string;
      readonly searchIndexable: boolean;
      readonly title: string | null | undefined;
    } | null | undefined;
  };
};
export type ComparisonSharingOperationsPublishComparisonSnapshotMutation = {
  response: ComparisonSharingOperationsPublishComparisonSnapshotMutation$data;
  variables: ComparisonSharingOperationsPublishComparisonSnapshotMutation$variables;
};

const node: ConcreteRequest = (function(){
var v0 = [
  {
    "defaultValue": null,
    "kind": "LocalArgument",
    "name": "input"
  }
],
v1 = [
  {
    "alias": null,
    "args": [
      {
        "kind": "Variable",
        "name": "input",
        "variableName": "input"
      }
    ],
    "concreteType": "PublishComparisonSnapshotPayload",
    "kind": "LinkedField",
    "name": "publishComparisonSnapshot",
    "plural": false,
    "selections": [
      {
        "alias": null,
        "args": null,
        "concreteType": "ComparisonSnapshot",
        "kind": "LinkedField",
        "name": "snapshot",
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
            "name": "searchIndexable",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "capturedAt",
            "storageKey": null
          }
        ],
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
        "concreteType": "MutationError",
        "kind": "LinkedField",
        "name": "errors",
        "plural": true,
        "selections": [
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "code",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "field",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "message",
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
    "name": "ComparisonSharingOperationsPublishComparisonSnapshotMutation",
    "selections": (v1/*: any*/),
    "type": "RootMutationType",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "ComparisonSharingOperationsPublishComparisonSnapshotMutation",
    "selections": (v1/*: any*/)
  },
  "params": {
    "cacheID": "bb7eeb5bc09c6cb38572f105703fa39b",
    "id": null,
    "metadata": {},
    "name": "ComparisonSharingOperationsPublishComparisonSnapshotMutation",
    "operationKind": "mutation",
    "text": "mutation ComparisonSharingOperationsPublishComparisonSnapshotMutation(\n  $input: PublishComparisonSnapshotInput!\n) {\n  publishComparisonSnapshot(input: $input) {\n    snapshot {\n      id\n      title\n      searchIndexable\n      capturedAt\n    }\n    sharePath\n    errors {\n      code\n      field\n      message\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "bf753ac6cfd7c5a85f44df4f77f8700e";

export default node;

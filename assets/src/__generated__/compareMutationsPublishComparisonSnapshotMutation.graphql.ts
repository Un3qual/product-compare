/**
 * @generated SignedSource<<ec8052d8a4e6a1919a22324cf7f43cf1>>
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
export type compareMutationsPublishComparisonSnapshotMutation$variables = {
  input: PublishComparisonSnapshotInput;
};
export type compareMutationsPublishComparisonSnapshotMutation$data = {
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
export type compareMutationsPublishComparisonSnapshotMutation = {
  response: compareMutationsPublishComparisonSnapshotMutation$data;
  variables: compareMutationsPublishComparisonSnapshotMutation$variables;
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
    "name": "compareMutationsPublishComparisonSnapshotMutation",
    "selections": (v1/*: any*/),
    "type": "RootMutationType",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "compareMutationsPublishComparisonSnapshotMutation",
    "selections": (v1/*: any*/)
  },
  "params": {
    "cacheID": "4ce62a11ecd9aa295973b58bea7bc949",
    "id": null,
    "metadata": {},
    "name": "compareMutationsPublishComparisonSnapshotMutation",
    "operationKind": "mutation",
    "text": "mutation compareMutationsPublishComparisonSnapshotMutation(\n  $input: PublishComparisonSnapshotInput!\n) {\n  publishComparisonSnapshot(input: $input) {\n    snapshot {\n      id\n      title\n      searchIndexable\n      capturedAt\n    }\n    sharePath\n    errors {\n      code\n      field\n      message\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "1280d49608cb3295ed32f3ceebf9beef";

export default node;

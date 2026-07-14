/**
 * @generated SignedSource<<e44c17551be793d659ca0419262e47b3>>
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
export type PublishComparisonSnapshotMutation$variables = {
  input: PublishComparisonSnapshotInput;
};
export type PublishComparisonSnapshotMutation$data = {
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
export type PublishComparisonSnapshotMutation = {
  response: PublishComparisonSnapshotMutation$data;
  variables: PublishComparisonSnapshotMutation$variables;
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
    "name": "PublishComparisonSnapshotMutation",
    "selections": (v1/*: any*/),
    "type": "RootMutationType",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "PublishComparisonSnapshotMutation",
    "selections": (v1/*: any*/)
  },
  "params": {
    "cacheID": "71f93eb50f29de6ee7e1152cd78d557d",
    "id": null,
    "metadata": {},
    "name": "PublishComparisonSnapshotMutation",
    "operationKind": "mutation",
    "text": "mutation PublishComparisonSnapshotMutation(\n  $input: PublishComparisonSnapshotInput!\n) {\n  publishComparisonSnapshot(input: $input) {\n    snapshot {\n      id\n      title\n      searchIndexable\n      capturedAt\n    }\n    sharePath\n    errors {\n      code\n      field\n      message\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "65496f2a2bad6ab263c9b53012a260d4";

export default node;

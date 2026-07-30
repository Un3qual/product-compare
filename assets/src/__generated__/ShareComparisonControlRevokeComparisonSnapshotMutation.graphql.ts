/**
 * @generated SignedSource<<9a427c1a7904b15254c40ce11fb4a012>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type ShareComparisonControlRevokeComparisonSnapshotMutation$variables = {
  snapshotId: string;
};
export type ShareComparisonControlRevokeComparisonSnapshotMutation$data = {
  readonly revokeComparisonSnapshot: {
    readonly errors: ReadonlyArray<{
      readonly code: string;
      readonly field: string | null | undefined;
      readonly message: string;
    }>;
    readonly revokedSnapshotId: string | null | undefined;
  };
};
export type ShareComparisonControlRevokeComparisonSnapshotMutation = {
  response: ShareComparisonControlRevokeComparisonSnapshotMutation$data;
  variables: ShareComparisonControlRevokeComparisonSnapshotMutation$variables;
};

const node: ConcreteRequest = (function(){
var v0 = [
  {
    "defaultValue": null,
    "kind": "LocalArgument",
    "name": "snapshotId"
  }
],
v1 = [
  {
    "alias": null,
    "args": [
      {
        "kind": "Variable",
        "name": "snapshotId",
        "variableName": "snapshotId"
      }
    ],
    "concreteType": "RevokeComparisonSnapshotPayload",
    "kind": "LinkedField",
    "name": "revokeComparisonSnapshot",
    "plural": false,
    "selections": [
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "revokedSnapshotId",
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
    "name": "ShareComparisonControlRevokeComparisonSnapshotMutation",
    "selections": (v1/*: any*/),
    "type": "RootMutationType",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "ShareComparisonControlRevokeComparisonSnapshotMutation",
    "selections": (v1/*: any*/)
  },
  "params": {
    "cacheID": "c36d28ed5c9d27da0f0ddea7375a1334",
    "id": null,
    "metadata": {},
    "name": "ShareComparisonControlRevokeComparisonSnapshotMutation",
    "operationKind": "mutation",
    "text": "mutation ShareComparisonControlRevokeComparisonSnapshotMutation(\n  $snapshotId: ID!\n) {\n  revokeComparisonSnapshot(snapshotId: $snapshotId) {\n    revokedSnapshotId\n    errors {\n      code\n      field\n      message\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "29044ae2a77c456c9727ca3bf499c0df";

export default node;

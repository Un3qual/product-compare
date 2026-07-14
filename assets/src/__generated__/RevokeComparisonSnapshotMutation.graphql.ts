/**
 * @generated SignedSource<<18a7bbbd7fafa5f27eaf407e955feeb8>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type RevokeComparisonSnapshotMutation$variables = {
  snapshotId: string;
};
export type RevokeComparisonSnapshotMutation$data = {
  readonly revokeComparisonSnapshot: {
    readonly errors: ReadonlyArray<{
      readonly code: string;
      readonly field: string | null | undefined;
      readonly message: string;
    }>;
    readonly revokedSnapshotId: string | null | undefined;
  };
};
export type RevokeComparisonSnapshotMutation = {
  response: RevokeComparisonSnapshotMutation$data;
  variables: RevokeComparisonSnapshotMutation$variables;
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
    "name": "RevokeComparisonSnapshotMutation",
    "selections": (v1/*: any*/),
    "type": "RootMutationType",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "RevokeComparisonSnapshotMutation",
    "selections": (v1/*: any*/)
  },
  "params": {
    "cacheID": "c2da4c99393eb1647ebe90b9300eea08",
    "id": null,
    "metadata": {},
    "name": "RevokeComparisonSnapshotMutation",
    "operationKind": "mutation",
    "text": "mutation RevokeComparisonSnapshotMutation(\n  $snapshotId: ID!\n) {\n  revokeComparisonSnapshot(snapshotId: $snapshotId) {\n    revokedSnapshotId\n    errors {\n      code\n      field\n      message\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "3b8656dc8a7fb4eda128a67c806772f3";

export default node;

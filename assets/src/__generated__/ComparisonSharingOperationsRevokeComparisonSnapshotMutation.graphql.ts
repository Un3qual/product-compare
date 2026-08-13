/**
 * @generated SignedSource<<b3445053c63deb5ef034fcfc9c65f711>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type ComparisonSharingOperationsRevokeComparisonSnapshotMutation$variables = {
  snapshotId: string;
};
export type ComparisonSharingOperationsRevokeComparisonSnapshotMutation$data = {
  readonly revokeComparisonSnapshot: {
    readonly errors: ReadonlyArray<{
      readonly code: string;
      readonly field: string | null;
      readonly message: string;
    }>;
    readonly revokedSnapshotId: string | null;
  };
};
export type ComparisonSharingOperationsRevokeComparisonSnapshotMutation = {
  response: ComparisonSharingOperationsRevokeComparisonSnapshotMutation$data;
  variables: ComparisonSharingOperationsRevokeComparisonSnapshotMutation$variables;
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
    "name": "ComparisonSharingOperationsRevokeComparisonSnapshotMutation",
    "selections": (v1/*: any*/),
    "type": "RootMutationType",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "ComparisonSharingOperationsRevokeComparisonSnapshotMutation",
    "selections": (v1/*: any*/)
  },
  "params": {
    "cacheID": "3e8973de5a4b64cf97fcfd1788710a6c",
    "id": null,
    "metadata": {},
    "name": "ComparisonSharingOperationsRevokeComparisonSnapshotMutation",
    "operationKind": "mutation",
    "text": "mutation ComparisonSharingOperationsRevokeComparisonSnapshotMutation(\n  $snapshotId: ID!\n) {\n  revokeComparisonSnapshot(snapshotId: $snapshotId) {\n    revokedSnapshotId\n    errors {\n      code\n      field\n      message\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "e0aa10ccbc6cf6eb4afa29f3e36cfb37";

export default node;

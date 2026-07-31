/**
 * @generated SignedSource<<f69c1b3893430555b21a1ef86141ab7f>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type compareMutationsRevokeComparisonSnapshotMutation$variables = {
  snapshotId: string;
};
export type compareMutationsRevokeComparisonSnapshotMutation$data = {
  readonly revokeComparisonSnapshot: {
    readonly errors: ReadonlyArray<{
      readonly code: string;
      readonly field: string | null | undefined;
      readonly message: string;
    }>;
    readonly revokedSnapshotId: string | null | undefined;
  };
};
export type compareMutationsRevokeComparisonSnapshotMutation = {
  response: compareMutationsRevokeComparisonSnapshotMutation$data;
  variables: compareMutationsRevokeComparisonSnapshotMutation$variables;
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
    "name": "compareMutationsRevokeComparisonSnapshotMutation",
    "selections": (v1/*: any*/),
    "type": "RootMutationType",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "compareMutationsRevokeComparisonSnapshotMutation",
    "selections": (v1/*: any*/)
  },
  "params": {
    "cacheID": "7d11e970f2c5c3e1e0c6f6f1ec391106",
    "id": null,
    "metadata": {},
    "name": "compareMutationsRevokeComparisonSnapshotMutation",
    "operationKind": "mutation",
    "text": "mutation compareMutationsRevokeComparisonSnapshotMutation(\n  $snapshotId: ID!\n) {\n  revokeComparisonSnapshot(snapshotId: $snapshotId) {\n    revokedSnapshotId\n    errors {\n      code\n      field\n      message\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "ec823c94f0ebf1a87a5a596e3e01a722";

export default node;

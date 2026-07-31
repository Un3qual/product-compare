/**
 * @generated SignedSource<<eb89ecee9a7d39cccd2d79966992ab3a>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type UpsertAffiliateNetworkInput = {
  name: string;
};
export type affiliateSetupMutationsUpsertAffiliateNetworkMutation$variables = {
  input: UpsertAffiliateNetworkInput;
};
export type affiliateSetupMutationsUpsertAffiliateNetworkMutation$data = {
  readonly upsertAffiliateNetwork: {
    readonly errors: ReadonlyArray<{
      readonly code: string;
      readonly field: string | null | undefined;
      readonly message: string;
    }>;
    readonly network: {
      readonly id: string;
      readonly name: string;
    } | null | undefined;
  } | null | undefined;
};
export type affiliateSetupMutationsUpsertAffiliateNetworkMutation = {
  response: affiliateSetupMutationsUpsertAffiliateNetworkMutation$data;
  variables: affiliateSetupMutationsUpsertAffiliateNetworkMutation$variables;
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
    "concreteType": "UpsertAffiliateNetworkPayload",
    "kind": "LinkedField",
    "name": "upsertAffiliateNetwork",
    "plural": false,
    "selections": [
      {
        "alias": null,
        "args": null,
        "concreteType": "AffiliateNetwork",
        "kind": "LinkedField",
        "name": "network",
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
            "name": "name",
            "storageKey": null
          }
        ],
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
    "name": "affiliateSetupMutationsUpsertAffiliateNetworkMutation",
    "selections": (v1/*: any*/),
    "type": "RootMutationType",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "affiliateSetupMutationsUpsertAffiliateNetworkMutation",
    "selections": (v1/*: any*/)
  },
  "params": {
    "cacheID": "3e170ee2aa4936a8407e697153855139",
    "id": null,
    "metadata": {},
    "name": "affiliateSetupMutationsUpsertAffiliateNetworkMutation",
    "operationKind": "mutation",
    "text": "mutation affiliateSetupMutationsUpsertAffiliateNetworkMutation(\n  $input: UpsertAffiliateNetworkInput!\n) {\n  upsertAffiliateNetwork(input: $input) {\n    network {\n      id\n      name\n    }\n    errors {\n      code\n      field\n      message\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "0a926bfa9e1264a678cb2b4463415428";

export default node;

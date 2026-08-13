/**
 * @generated SignedSource<<43ceff4e04f5c6ab8a2e7cb64298a326>>
 * @lightSyntaxTransform
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type UpsertAffiliateNetworkInput = {
  name: string;
};
export type AffiliateSetupOperationsUpsertAffiliateNetworkMutation$variables = {
  input: UpsertAffiliateNetworkInput;
};
export type AffiliateSetupOperationsUpsertAffiliateNetworkMutation$data = {
  readonly upsertAffiliateNetwork: {
    readonly errors: ReadonlyArray<{
      readonly code: string;
      readonly field: string | null;
      readonly message: string;
    }>;
    readonly network: {
      readonly id: string;
      readonly name: string;
    } | null;
  } | null;
};
export type AffiliateSetupOperationsUpsertAffiliateNetworkMutation = {
  response: AffiliateSetupOperationsUpsertAffiliateNetworkMutation$data;
  variables: AffiliateSetupOperationsUpsertAffiliateNetworkMutation$variables;
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
    "argumentDefinitions": (v0/*:: as any*/),
    "kind": "Fragment",
    "metadata": null,
    "name": "AffiliateSetupOperationsUpsertAffiliateNetworkMutation",
    "selections": (v1/*:: as any*/),
    "type": "RootMutationType",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*:: as any*/),
    "kind": "Operation",
    "name": "AffiliateSetupOperationsUpsertAffiliateNetworkMutation",
    "selections": (v1/*:: as any*/)
  },
  "params": {
    "cacheID": "36ae2c53155c533b00c032cfda51249f",
    "id": null,
    "metadata": {},
    "name": "AffiliateSetupOperationsUpsertAffiliateNetworkMutation",
    "operationKind": "mutation",
    "text": "mutation AffiliateSetupOperationsUpsertAffiliateNetworkMutation(\n  $input: UpsertAffiliateNetworkInput!\n) {\n  upsertAffiliateNetwork(input: $input) {\n    network {\n      id\n      name\n    }\n    errors {\n      code\n      field\n      message\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "334d50734751e3f980a53ce42afeec12";

export default node;

/**
 * @generated SignedSource<<1a49db9cc5c6a1e66714ac429edb9dd3>>
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
export type UpsertAffiliateNetworkMutation$variables = {
  input: UpsertAffiliateNetworkInput;
};
export type UpsertAffiliateNetworkMutation$data = {
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
export type UpsertAffiliateNetworkMutation = {
  response: UpsertAffiliateNetworkMutation$data;
  variables: UpsertAffiliateNetworkMutation$variables;
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
    "name": "UpsertAffiliateNetworkMutation",
    "selections": (v1/*: any*/),
    "type": "RootMutationType",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "UpsertAffiliateNetworkMutation",
    "selections": (v1/*: any*/)
  },
  "params": {
    "cacheID": "7458bbe93ac79d1ea2d44a0bf0d56f35",
    "id": null,
    "metadata": {},
    "name": "UpsertAffiliateNetworkMutation",
    "operationKind": "mutation",
    "text": "mutation UpsertAffiliateNetworkMutation(\n  $input: UpsertAffiliateNetworkInput!\n) {\n  upsertAffiliateNetwork(input: $input) {\n    network {\n      id\n      name\n    }\n    errors {\n      code\n      field\n      message\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "c9137066d512e87f08c9109fc46ab4fb";

export default node;

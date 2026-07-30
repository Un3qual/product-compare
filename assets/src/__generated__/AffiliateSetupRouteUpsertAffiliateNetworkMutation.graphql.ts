/**
 * @generated SignedSource<<f8971d6f71a71ccb7b6bffe034ff6a39>>
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
export type AffiliateSetupRouteUpsertAffiliateNetworkMutation$variables = {
  input: UpsertAffiliateNetworkInput;
};
export type AffiliateSetupRouteUpsertAffiliateNetworkMutation$data = {
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
export type AffiliateSetupRouteUpsertAffiliateNetworkMutation = {
  response: AffiliateSetupRouteUpsertAffiliateNetworkMutation$data;
  variables: AffiliateSetupRouteUpsertAffiliateNetworkMutation$variables;
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
    "name": "AffiliateSetupRouteUpsertAffiliateNetworkMutation",
    "selections": (v1/*: any*/),
    "type": "RootMutationType",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "AffiliateSetupRouteUpsertAffiliateNetworkMutation",
    "selections": (v1/*: any*/)
  },
  "params": {
    "cacheID": "d4177e11cee82578fc518d1288da79e4",
    "id": null,
    "metadata": {},
    "name": "AffiliateSetupRouteUpsertAffiliateNetworkMutation",
    "operationKind": "mutation",
    "text": "mutation AffiliateSetupRouteUpsertAffiliateNetworkMutation(\n  $input: UpsertAffiliateNetworkInput!\n) {\n  upsertAffiliateNetwork(input: $input) {\n    network {\n      id\n      name\n    }\n    errors {\n      code\n      field\n      message\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "85930d6597c3e47d752cf1fcc7b408b4";

export default node;

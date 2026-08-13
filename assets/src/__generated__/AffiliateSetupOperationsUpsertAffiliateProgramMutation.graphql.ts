/**
 * @generated SignedSource<<b8f205e85e7f0e9a06ae6d73defe0703>>
 * @lightSyntaxTransform
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type UpsertAffiliateProgramInput = {
  affiliateNetworkId: string;
  merchantId: string;
  programCode?: string | null;
  status?: string | null;
};
export type AffiliateSetupOperationsUpsertAffiliateProgramMutation$variables = {
  input: UpsertAffiliateProgramInput;
};
export type AffiliateSetupOperationsUpsertAffiliateProgramMutation$data = {
  readonly upsertAffiliateProgram: {
    readonly errors: ReadonlyArray<{
      readonly code: string;
      readonly field: string | null;
      readonly message: string;
    }>;
    readonly program: {
      readonly affiliateNetworkId: string;
      readonly id: string;
      readonly merchantId: string;
      readonly programCode: string | null;
      readonly status: string | null;
    } | null;
  } | null;
};
export type AffiliateSetupOperationsUpsertAffiliateProgramMutation = {
  response: AffiliateSetupOperationsUpsertAffiliateProgramMutation$data;
  variables: AffiliateSetupOperationsUpsertAffiliateProgramMutation$variables;
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
    "concreteType": "UpsertAffiliateProgramPayload",
    "kind": "LinkedField",
    "name": "upsertAffiliateProgram",
    "plural": false,
    "selections": [
      {
        "alias": null,
        "args": null,
        "concreteType": "AffiliateProgram",
        "kind": "LinkedField",
        "name": "program",
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
            "name": "affiliateNetworkId",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "merchantId",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "programCode",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "status",
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
    "name": "AffiliateSetupOperationsUpsertAffiliateProgramMutation",
    "selections": (v1/*:: as any*/),
    "type": "RootMutationType",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*:: as any*/),
    "kind": "Operation",
    "name": "AffiliateSetupOperationsUpsertAffiliateProgramMutation",
    "selections": (v1/*:: as any*/)
  },
  "params": {
    "cacheID": "a34ddc2c8cf4fce3f0d8c1097ad4f2a4",
    "id": null,
    "metadata": {},
    "name": "AffiliateSetupOperationsUpsertAffiliateProgramMutation",
    "operationKind": "mutation",
    "text": "mutation AffiliateSetupOperationsUpsertAffiliateProgramMutation(\n  $input: UpsertAffiliateProgramInput!\n) {\n  upsertAffiliateProgram(input: $input) {\n    program {\n      id\n      affiliateNetworkId\n      merchantId\n      programCode\n      status\n    }\n    errors {\n      code\n      field\n      message\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "014c1c34b148899f5c499d21a808b16c";

export default node;

/**
 * @generated SignedSource<<3a02fbda6afdb73a3041db8af43b9fa0>>
 * @lightSyntaxTransform
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type UpdateCJCommissionIngestionSettingsInput = {
  enabled?: boolean | null;
  intervalMinutes?: number | null;
  lookbackDays?: number | null;
  maxPages?: number | null;
};
export type UpdateCJCommissionIngestionSettingsMutation$variables = {
  input: UpdateCJCommissionIngestionSettingsInput;
};
export type UpdateCJCommissionIngestionSettingsMutation$data = {
  readonly updateCjCommissionIngestionSettings: {
    readonly errors: ReadonlyArray<{
      readonly code: string;
      readonly field: string | null;
      readonly message: string;
    }>;
    readonly ingestion: {
      readonly settings: {
        readonly updatedAt: string;
      };
    } | null;
  };
};
export type UpdateCJCommissionIngestionSettingsMutation = {
  response: UpdateCJCommissionIngestionSettingsMutation$data;
  variables: UpdateCJCommissionIngestionSettingsMutation$variables;
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
    "concreteType": "CJCommissionIngestionPayload",
    "kind": "LinkedField",
    "name": "updateCjCommissionIngestionSettings",
    "plural": false,
    "selections": [
      {
        "alias": null,
        "args": null,
        "concreteType": "CJCommissionIngestion",
        "kind": "LinkedField",
        "name": "ingestion",
        "plural": false,
        "selections": [
          {
            "alias": null,
            "args": null,
            "concreteType": "CJCommissionIngestionSettings",
            "kind": "LinkedField",
            "name": "settings",
            "plural": false,
            "selections": [
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "updatedAt",
                "storageKey": null
              }
            ],
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
    "name": "UpdateCJCommissionIngestionSettingsMutation",
    "selections": (v1/*:: as any*/),
    "type": "RootMutationType",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*:: as any*/),
    "kind": "Operation",
    "name": "UpdateCJCommissionIngestionSettingsMutation",
    "selections": (v1/*:: as any*/)
  },
  "params": {
    "cacheID": "53fb3d24ec85b901426913bc5d15774e",
    "id": null,
    "metadata": {},
    "name": "UpdateCJCommissionIngestionSettingsMutation",
    "operationKind": "mutation",
    "text": "mutation UpdateCJCommissionIngestionSettingsMutation(\n  $input: UpdateCJCommissionIngestionSettingsInput!\n) {\n  updateCjCommissionIngestionSettings(input: $input) {\n    ingestion {\n      settings {\n        updatedAt\n      }\n    }\n    errors {\n      code\n      field\n      message\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "30534f76212cde3512a17ad97fe84259";

export default node;

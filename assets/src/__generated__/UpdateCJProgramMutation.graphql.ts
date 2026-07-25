/**
 * @generated SignedSource<<9a17eb12d13f0c37de192d51d5b69ac7>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type CJProgramStage = "ACCEPTED" | "APPLIED" | "CONSIDERING" | "DECLINED" | "NEW" | "NOT_PURSUING" | "SELECTED" | "%future added value";
export type CJProgramWarningCode = "MISSING_ADVERTISER_NAME" | "MISSING_PRODUCT_COUNT" | "NON_ENGLISH_LANGUAGE" | "NON_USD_CURRENCY" | "NON_US_MARKET" | "%future added value";
export type UpdateCjProgramInput = {
  id: string;
  note?: string | null | undefined;
  stage: CJProgramStage;
};
export type UpdateCJProgramMutation$variables = {
  input: UpdateCjProgramInput;
};
export type UpdateCJProgramMutation$data = {
  readonly updateCjProgram: {
    readonly errors: ReadonlyArray<{
      readonly code: string;
      readonly field: string | null | undefined;
      readonly message: string;
    }>;
    readonly program: {
      readonly id: string;
      readonly lastChanged: any;
      readonly note: string | null | undefined;
      readonly stage: CJProgramStage;
      readonly warningCodes: ReadonlyArray<CJProgramWarningCode>;
    } | null | undefined;
  };
};
export type UpdateCJProgramMutation = {
  response: UpdateCJProgramMutation$data;
  variables: UpdateCJProgramMutation$variables;
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
    "concreteType": "UpdateCjProgramPayload",
    "kind": "LinkedField",
    "name": "updateCjProgram",
    "plural": false,
    "selections": [
      {
        "alias": null,
        "args": null,
        "concreteType": "CJProgram",
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
            "name": "stage",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "note",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "lastChanged",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "warningCodes",
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
    "name": "UpdateCJProgramMutation",
    "selections": (v1/*: any*/),
    "type": "RootMutationType",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "UpdateCJProgramMutation",
    "selections": (v1/*: any*/)
  },
  "params": {
    "cacheID": "56f07a6bb4e6fbfd155dd6931a3adeae",
    "id": null,
    "metadata": {},
    "name": "UpdateCJProgramMutation",
    "operationKind": "mutation",
    "text": "mutation UpdateCJProgramMutation(\n  $input: UpdateCjProgramInput!\n) {\n  updateCjProgram(input: $input) {\n    program {\n      id\n      stage\n      note\n      lastChanged\n      warningCodes\n    }\n    errors {\n      code\n      field\n      message\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "cc61ba50f040848b44acfda0b38a770b";

export default node;

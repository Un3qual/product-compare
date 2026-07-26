/**
 * @generated SignedSource<<01e0eb1143ad17e2aef0b02d77445311>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type CJProgramStage = "ACCEPTED" | "APPLIED" | "CONSIDERING" | "DECLINED" | "NEW" | "NOT_PURSUING" | "SELECTED" | "%future added value";
export type UpdateCjProgramInput = {
  expectedChangedAt: any;
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
    "cacheID": "ce72d13a53f046013bc17ccdefd09b8c",
    "id": null,
    "metadata": {},
    "name": "UpdateCJProgramMutation",
    "operationKind": "mutation",
    "text": "mutation UpdateCJProgramMutation(\n  $input: UpdateCjProgramInput!\n) {\n  updateCjProgram(input: $input) {\n    errors {\n      code\n      field\n      message\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "9c3b5102cf29cca7377412229f423e84";

export default node;

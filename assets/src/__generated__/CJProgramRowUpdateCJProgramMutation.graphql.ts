/**
 * @generated SignedSource<<dd67bf6a81d61377e3e9bbb96b4be5c1>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from "relay-runtime";
export type CJProgramStage =
  | "ACCEPTED"
  | "APPLIED"
  | "CONSIDERING"
  | "DECLINED"
  | "NEW"
  | "NOT_PURSUING"
  | "SELECTED"
  | "%future added value";
export type UpdateCjProgramInput = {
  expectedChangedAt: string;
  id: string;
  note?: string | null | undefined;
  stage: CJProgramStage;
};
export type CJProgramRowUpdateCJProgramMutation$variables = {
  input: UpdateCjProgramInput;
};
export type CJProgramRowUpdateCJProgramMutation$data = {
  readonly updateCjProgram: {
    readonly errors: ReadonlyArray<{
      readonly code: string;
      readonly field: string | null | undefined;
      readonly message: string;
    }>;
  };
};
export type CJProgramRowUpdateCJProgramMutation = {
  response: CJProgramRowUpdateCJProgramMutation$data;
  variables: CJProgramRowUpdateCJProgramMutation$variables;
};

const node: ConcreteRequest = (function () {
  var v0 = [
      {
        defaultValue: null,
        kind: "LocalArgument",
        name: "input",
      },
    ],
    v1 = [
      {
        alias: null,
        args: [
          {
            kind: "Variable",
            name: "input",
            variableName: "input",
          },
        ],
        concreteType: "UpdateCjProgramPayload",
        kind: "LinkedField",
        name: "updateCjProgram",
        plural: false,
        selections: [
          {
            alias: null,
            args: null,
            concreteType: "MutationError",
            kind: "LinkedField",
            name: "errors",
            plural: true,
            selections: [
              {
                alias: null,
                args: null,
                kind: "ScalarField",
                name: "code",
                storageKey: null,
              },
              {
                alias: null,
                args: null,
                kind: "ScalarField",
                name: "field",
                storageKey: null,
              },
              {
                alias: null,
                args: null,
                kind: "ScalarField",
                name: "message",
                storageKey: null,
              },
            ],
            storageKey: null,
          },
        ],
        storageKey: null,
      },
    ];
  return {
    fragment: {
      argumentDefinitions: v0 /*: any*/,
      kind: "Fragment",
      metadata: null,
      name: "CJProgramRowUpdateCJProgramMutation",
      selections: v1 /*: any*/,
      type: "RootMutationType",
      abstractKey: null,
    },
    kind: "Request",
    operation: {
      argumentDefinitions: v0 /*: any*/,
      kind: "Operation",
      name: "CJProgramRowUpdateCJProgramMutation",
      selections: v1 /*: any*/,
    },
    params: {
      cacheID: "53a9de2f70ed5ad98ee90851479f2a86",
      id: null,
      metadata: {},
      name: "CJProgramRowUpdateCJProgramMutation",
      operationKind: "mutation",
      text: "mutation CJProgramRowUpdateCJProgramMutation(\n  $input: UpdateCjProgramInput!\n) {\n  updateCjProgram(input: $input) {\n    errors {\n      code\n      field\n      message\n    }\n  }\n}\n",
    },
  };
})();

(node as any).hash = "1c3aaa59813d141d130c9573b02c49b6";

export default node;

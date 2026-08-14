/**
 * @generated SignedSource<<8dae7d9da3819282f32358743e261fad>>
 * @lightSyntaxTransform
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type CJProgramStage = "ACCEPTED" | "APPLIED" | "CONSIDERING" | "DECLINED" | "NEW" | "NOT_PURSUING" | "SELECTED" | "%future added value";
export type UpdateCjProgramInput = {
  expectedChangedAt: string;
  id: string;
  note?: string | null;
  stage: CJProgramStage;
};
export type ProgramLifecycleRowUpdateCJProgramMutation$variables = {
  input: UpdateCjProgramInput;
};
export type ProgramLifecycleRowUpdateCJProgramMutation$data = {
  readonly updateCjProgram: {
    readonly errors: ReadonlyArray<{
      readonly code: string;
      readonly field: string | null;
      readonly message: string;
    }>;
  };
};
export type ProgramLifecycleRowUpdateCJProgramMutation = {
  response: ProgramLifecycleRowUpdateCJProgramMutation$data;
  variables: ProgramLifecycleRowUpdateCJProgramMutation$variables;
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
    "argumentDefinitions": (v0/*:: as any*/),
    "kind": "Fragment",
    "metadata": null,
    "name": "ProgramLifecycleRowUpdateCJProgramMutation",
    "selections": (v1/*:: as any*/),
    "type": "RootMutationType",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*:: as any*/),
    "kind": "Operation",
    "name": "ProgramLifecycleRowUpdateCJProgramMutation",
    "selections": (v1/*:: as any*/)
  },
  "params": {
    "cacheID": "e3c7c1e3a1c660dd955545d931496d5a",
    "id": null,
    "metadata": {},
    "name": "ProgramLifecycleRowUpdateCJProgramMutation",
    "operationKind": "mutation",
    "text": "mutation ProgramLifecycleRowUpdateCJProgramMutation(\n  $input: UpdateCjProgramInput!\n) {\n  updateCjProgram(input: $input) {\n    errors {\n      code\n      field\n      message\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "2a63bfb22038db72588d0822f4f1bae0";

export default node;

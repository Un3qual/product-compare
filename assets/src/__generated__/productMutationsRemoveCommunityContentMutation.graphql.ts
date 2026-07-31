/**
 * @generated SignedSource<<485a4c5a36c318e6a1c1b5eaff037eea>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type CommunityContentType = "ANSWER" | "QUESTION" | "REVIEW" | "%future added value";
export type RemoveCommunityContentInput = {
  contentId: string;
  contentType: CommunityContentType;
};
export type productMutationsRemoveCommunityContentMutation$variables = {
  input: RemoveCommunityContentInput;
};
export type productMutationsRemoveCommunityContentMutation$data = {
  readonly removeCommunityContent: {
    readonly errors: ReadonlyArray<{
      readonly code: string;
      readonly field: string | null | undefined;
      readonly message: string;
    }>;
    readonly removedContentId: string | null | undefined;
  };
};
export type productMutationsRemoveCommunityContentMutation = {
  response: productMutationsRemoveCommunityContentMutation$data;
  variables: productMutationsRemoveCommunityContentMutation$variables;
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
    "concreteType": "RemoveCommunityContentPayload",
    "kind": "LinkedField",
    "name": "removeCommunityContent",
    "plural": false,
    "selections": [
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "removedContentId",
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
    "name": "productMutationsRemoveCommunityContentMutation",
    "selections": (v1/*: any*/),
    "type": "RootMutationType",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "productMutationsRemoveCommunityContentMutation",
    "selections": (v1/*: any*/)
  },
  "params": {
    "cacheID": "045fc6902c2d81a3f700cca3b3513b6b",
    "id": null,
    "metadata": {},
    "name": "productMutationsRemoveCommunityContentMutation",
    "operationKind": "mutation",
    "text": "mutation productMutationsRemoveCommunityContentMutation(\n  $input: RemoveCommunityContentInput!\n) {\n  removeCommunityContent(input: $input) {\n    removedContentId\n    errors {\n      code\n      field\n      message\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "8f683644c5594be1cecbe45d019bd3e2";

export default node;

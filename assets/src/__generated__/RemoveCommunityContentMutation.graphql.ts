/**
 * @generated SignedSource<<ac24f18b7a06b7a09b7830601752ea08>>
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
export type RemoveCommunityContentMutation$variables = {
  input: RemoveCommunityContentInput;
};
export type RemoveCommunityContentMutation$data = {
  readonly removeCommunityContent: {
    readonly errors: ReadonlyArray<{
      readonly code: string;
      readonly field: string | null | undefined;
      readonly message: string;
    }>;
    readonly removedContentId: string | null | undefined;
  };
};
export type RemoveCommunityContentMutation = {
  response: RemoveCommunityContentMutation$data;
  variables: RemoveCommunityContentMutation$variables;
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
    "name": "RemoveCommunityContentMutation",
    "selections": (v1/*: any*/),
    "type": "RootMutationType",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "RemoveCommunityContentMutation",
    "selections": (v1/*: any*/)
  },
  "params": {
    "cacheID": "40ea4b88a9e57a730002d61569d29fbd",
    "id": null,
    "metadata": {},
    "name": "RemoveCommunityContentMutation",
    "operationKind": "mutation",
    "text": "mutation RemoveCommunityContentMutation(\n  $input: RemoveCommunityContentInput!\n) {\n  removeCommunityContent(input: $input) {\n    removedContentId\n    errors {\n      code\n      field\n      message\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "1322a7d84966b17106cff2157945b82e";

export default node;

/**
 * @generated SignedSource<<799513778257a72b978ed01e2e48dcd3>>
 * @lightSyntaxTransform
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
export type ProductCommunityOperationsRemoveCommunityContentMutation$variables = {
  input: RemoveCommunityContentInput;
};
export type ProductCommunityOperationsRemoveCommunityContentMutation$data = {
  readonly removeCommunityContent: {
    readonly errors: ReadonlyArray<{
      readonly code: string;
      readonly field: string | null;
      readonly message: string;
    }>;
    readonly removedContentId: string | null;
  };
};
export type ProductCommunityOperationsRemoveCommunityContentMutation = {
  response: ProductCommunityOperationsRemoveCommunityContentMutation$data;
  variables: ProductCommunityOperationsRemoveCommunityContentMutation$variables;
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
    "argumentDefinitions": (v0/*:: as any*/),
    "kind": "Fragment",
    "metadata": null,
    "name": "ProductCommunityOperationsRemoveCommunityContentMutation",
    "selections": (v1/*:: as any*/),
    "type": "RootMutationType",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*:: as any*/),
    "kind": "Operation",
    "name": "ProductCommunityOperationsRemoveCommunityContentMutation",
    "selections": (v1/*:: as any*/)
  },
  "params": {
    "cacheID": "aac879b07bd8cc534a2d32d8adfb6306",
    "id": null,
    "metadata": {},
    "name": "ProductCommunityOperationsRemoveCommunityContentMutation",
    "operationKind": "mutation",
    "text": "mutation ProductCommunityOperationsRemoveCommunityContentMutation(\n  $input: RemoveCommunityContentInput!\n) {\n  removeCommunityContent(input: $input) {\n    removedContentId\n    errors {\n      code\n      field\n      message\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "2a0c8c99c0d51f21a916cf9b34bde6e3";

export default node;

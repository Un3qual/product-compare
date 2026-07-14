/**
 * @generated SignedSource<<e2e1fffe18d015d744eb5554d7d21bee>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type RootViewerRouteQuery$variables = Record<PropertyKey, never>;
export type RootViewerRouteQuery$data = {
  readonly viewer: {
    readonly email: string;
    readonly id: string;
    readonly isOperator: boolean;
  } | null | undefined;
};
export type RootViewerRouteQuery = {
  response: RootViewerRouteQuery$data;
  variables: RootViewerRouteQuery$variables;
};

const node: ConcreteRequest = (function(){
var v0 = [
  {
    "alias": null,
    "args": null,
    "concreteType": "User",
    "kind": "LinkedField",
    "name": "viewer",
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
        "name": "email",
        "storageKey": null
      },
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "isOperator",
        "storageKey": null
      }
    ],
    "storageKey": null
  }
];
return {
  "fragment": {
    "argumentDefinitions": [],
    "kind": "Fragment",
    "metadata": null,
    "name": "RootViewerRouteQuery",
    "selections": (v0/*: any*/),
    "type": "RootQueryType",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": [],
    "kind": "Operation",
    "name": "RootViewerRouteQuery",
    "selections": (v0/*: any*/)
  },
  "params": {
    "cacheID": "5a9abb7ca427edcc6dc33aa9779f187e",
    "id": null,
    "metadata": {},
    "name": "RootViewerRouteQuery",
    "operationKind": "query",
    "text": "query RootViewerRouteQuery {\n  viewer {\n    id\n    email\n    isOperator\n  }\n}\n"
  }
};
})();

(node as any).hash = "8ffe3b068359ec7370b48fae4f249829";

export default node;

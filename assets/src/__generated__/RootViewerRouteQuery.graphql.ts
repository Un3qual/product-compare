/**
 * @generated SignedSource<<897370fbc297c46a06e38e0e3fa2280c>>
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
    "type": "Query",
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
    "cacheID": "f9af563cefb1330e6dcb6869cf35ca28",
    "id": null,
    "metadata": {},
    "name": "RootViewerRouteQuery",
    "operationKind": "query",
    "text": "query RootViewerRouteQuery {\n  viewer {\n    id\n    email\n  }\n}\n"
  }
};
})();

(node as any).hash = "1573f8b6aa7d8c1b3ae911731f1f7816";

export default node;

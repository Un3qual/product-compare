/**
 * @generated SignedSource<<6df044a80b79de4525120a8b626bf258>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type RootRouteQuery$variables = Record<PropertyKey, never>;
export type RootRouteQuery$data = {
  readonly viewer: {
    readonly email: string;
    readonly id: string;
    readonly isOperator: boolean;
  } | null;
};
export type RootRouteQuery = {
  response: RootRouteQuery$data;
  variables: RootRouteQuery$variables;
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
    "name": "RootRouteQuery",
    "selections": (v0/*: any*/),
    "type": "RootQueryType",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": [],
    "kind": "Operation",
    "name": "RootRouteQuery",
    "selections": (v0/*: any*/)
  },
  "params": {
    "cacheID": "9ee512622d83fbf8088e5bf97a78269c",
    "id": null,
    "metadata": {},
    "name": "RootRouteQuery",
    "operationKind": "query",
    "text": "query RootRouteQuery {\n  viewer {\n    id\n    email\n    isOperator\n  }\n}\n"
  }
};
})();

(node as any).hash = "20b8d9fc104413135d9518645692234f";

export default node;

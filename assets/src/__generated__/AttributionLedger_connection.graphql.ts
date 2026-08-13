/**
 * @generated SignedSource<<18e2fec09c665ce54f117f8d7ab69fa4>>
 * @lightSyntaxTransform
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ReaderFragment } from 'relay-runtime';
import { FragmentRefs } from "relay-runtime";
export type AttributionLedger_connection$data = {
  readonly commerceAttributionClicks: {
    readonly edges: ReadonlyArray<{
      readonly node: {
        readonly clickId: string;
        readonly " $fragmentSpreads": FragmentRefs<"AttributionLedger_row">;
      };
    }>;
  };
  readonly " $fragmentType": "AttributionLedger_connection";
};
export type AttributionLedger_connection$key = {
  readonly " $data"?: AttributionLedger_connection$data;
  readonly " $fragmentSpreads": FragmentRefs<"AttributionLedger_connection">;
};

import AttributionLedgerPaginationQuery_graphql from './AttributionLedgerPaginationQuery.graphql';

const node: ReaderFragment = (function(){
var v0 = [
  "commerceAttributionClicks"
];
return {
  "argumentDefinitions": [
    {
      "defaultValue": null,
      "kind": "LocalArgument",
      "name": "after"
    },
    {
      "defaultValue": null,
      "kind": "LocalArgument",
      "name": "first"
    },
    {
      "defaultValue": null,
      "kind": "LocalArgument",
      "name": "input"
    }
  ],
  "kind": "Fragment",
  "metadata": {
    "connection": [
      {
        "count": "first",
        "cursor": "after",
        "direction": "forward",
        "path": (v0/*:: as any*/)
      }
    ],
    "refetch": {
      "connection": {
        "forward": {
          "count": "first",
          "cursor": "after"
        },
        "backward": null,
        "path": (v0/*:: as any*/)
      },
      "fragmentPathInResult": [],
      "operation": AttributionLedgerPaginationQuery_graphql
    }
  },
  "name": "AttributionLedger_connection",
  "selections": [
    {
      "alias": "commerceAttributionClicks",
      "args": [
        {
          "kind": "Variable",
          "name": "input",
          "variableName": "input"
        }
      ],
      "concreteType": "CommerceAttributionClickConnection",
      "kind": "LinkedField",
      "name": "__AttributionLedger_commerceAttributionClicks_connection",
      "plural": false,
      "selections": [
        {
          "alias": null,
          "args": null,
          "concreteType": "CommerceAttributionClickEdge",
          "kind": "LinkedField",
          "name": "edges",
          "plural": true,
          "selections": [
            {
              "alias": null,
              "args": null,
              "concreteType": "CommerceAttributionClick",
              "kind": "LinkedField",
              "name": "node",
              "plural": false,
              "selections": [
                {
                  "alias": null,
                  "args": null,
                  "kind": "ScalarField",
                  "name": "clickId",
                  "storageKey": null
                },
                {
                  "args": null,
                  "kind": "FragmentSpread",
                  "name": "AttributionLedger_row"
                },
                {
                  "alias": null,
                  "args": null,
                  "kind": "ScalarField",
                  "name": "__typename",
                  "storageKey": null
                }
              ],
              "storageKey": null
            },
            {
              "alias": null,
              "args": null,
              "kind": "ScalarField",
              "name": "cursor",
              "storageKey": null
            }
          ],
          "storageKey": null
        },
        {
          "alias": null,
          "args": null,
          "concreteType": "PageInfo",
          "kind": "LinkedField",
          "name": "pageInfo",
          "plural": false,
          "selections": [
            {
              "alias": null,
              "args": null,
              "kind": "ScalarField",
              "name": "endCursor",
              "storageKey": null
            },
            {
              "alias": null,
              "args": null,
              "kind": "ScalarField",
              "name": "hasNextPage",
              "storageKey": null
            }
          ],
          "storageKey": null
        }
      ],
      "storageKey": null
    }
  ],
  "type": "RootQueryType",
  "abstractKey": null
};
})();

(node as any).hash = "0c0b37b5ba210723492a12c1a516c313";

export default node;

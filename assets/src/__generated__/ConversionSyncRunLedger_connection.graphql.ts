/**
 * @generated SignedSource<<25fbae7ef6350999a4616c39e21d6878>>
 * @lightSyntaxTransform
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ReaderFragment } from 'relay-runtime';
export type CJCommissionSyncRunStatus = "FAILED" | "RUNNING" | "SUCCEEDED" | "%future added value";
export type CJCommissionSyncRunTrigger = "CLI" | "OPERATOR" | "SCHEDULED" | "%future added value";
import { FragmentRefs } from "relay-runtime";
export type ConversionSyncRunLedger_connection$data = {
  readonly cjCommissionSyncRuns: {
    readonly edges: ReadonlyArray<{
      readonly cursor: string;
      readonly node: {
        readonly cursor: string | null;
        readonly errorSummary: string | null;
        readonly finishedAt: string | null;
        readonly id: string;
        readonly pagesFetched: number;
        readonly recordsFailed: number;
        readonly recordsFetched: number;
        readonly recordsPersisted: number;
        readonly requesterEmail: string | null;
        readonly startedAt: string;
        readonly status: CJCommissionSyncRunStatus;
        readonly trigger: CJCommissionSyncRunTrigger;
        readonly windowEnd: string;
        readonly windowStart: string;
      };
    }>;
  };
  readonly " $fragmentType": "ConversionSyncRunLedger_connection";
};
export type ConversionSyncRunLedger_connection$key = {
  readonly " $data"?: ConversionSyncRunLedger_connection$data;
  readonly " $fragmentSpreads": FragmentRefs<"ConversionSyncRunLedger_connection">;
};

import ConversionSyncRunLedgerPaginationQuery_graphql from './ConversionSyncRunLedgerPaginationQuery.graphql';

const node: ReaderFragment = (function(){
var v0 = [
  "cjCommissionSyncRuns"
],
v1 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "cursor",
  "storageKey": null
};
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
      "operation": ConversionSyncRunLedgerPaginationQuery_graphql
    }
  },
  "name": "ConversionSyncRunLedger_connection",
  "selections": [
    {
      "alias": "cjCommissionSyncRuns",
      "args": null,
      "concreteType": "CJCommissionSyncRunConnection",
      "kind": "LinkedField",
      "name": "__ConversionSyncRunLedger_cjCommissionSyncRuns_connection",
      "plural": false,
      "selections": [
        {
          "alias": null,
          "args": null,
          "concreteType": "CJCommissionSyncRunEdge",
          "kind": "LinkedField",
          "name": "edges",
          "plural": true,
          "selections": [
            (v1/*:: as any*/),
            {
              "alias": null,
              "args": null,
              "concreteType": "CJCommissionSyncRun",
              "kind": "LinkedField",
              "name": "node",
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
                  "name": "status",
                  "storageKey": null
                },
                {
                  "alias": null,
                  "args": null,
                  "kind": "ScalarField",
                  "name": "trigger",
                  "storageKey": null
                },
                {
                  "alias": null,
                  "args": null,
                  "kind": "ScalarField",
                  "name": "requesterEmail",
                  "storageKey": null
                },
                {
                  "alias": null,
                  "args": null,
                  "kind": "ScalarField",
                  "name": "windowStart",
                  "storageKey": null
                },
                {
                  "alias": null,
                  "args": null,
                  "kind": "ScalarField",
                  "name": "windowEnd",
                  "storageKey": null
                },
                (v1/*:: as any*/),
                {
                  "alias": null,
                  "args": null,
                  "kind": "ScalarField",
                  "name": "pagesFetched",
                  "storageKey": null
                },
                {
                  "alias": null,
                  "args": null,
                  "kind": "ScalarField",
                  "name": "recordsFetched",
                  "storageKey": null
                },
                {
                  "alias": null,
                  "args": null,
                  "kind": "ScalarField",
                  "name": "recordsPersisted",
                  "storageKey": null
                },
                {
                  "alias": null,
                  "args": null,
                  "kind": "ScalarField",
                  "name": "recordsFailed",
                  "storageKey": null
                },
                {
                  "alias": null,
                  "args": null,
                  "kind": "ScalarField",
                  "name": "startedAt",
                  "storageKey": null
                },
                {
                  "alias": null,
                  "args": null,
                  "kind": "ScalarField",
                  "name": "finishedAt",
                  "storageKey": null
                },
                {
                  "alias": null,
                  "args": null,
                  "kind": "ScalarField",
                  "name": "errorSummary",
                  "storageKey": null
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

(node as any).hash = "a04edf9679b6f70deaf8f6431a7ef0fa";

export default node;

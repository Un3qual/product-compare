/**
 * @generated SignedSource<<46ad3f2ddf0f31be100d425791055066>>
 * @lightSyntaxTransform
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ReaderFragment } from 'relay-runtime';
export type CJCommissionIngestionActivityState = "AVAILABLE" | "EXECUTING" | "RETRYABLE" | "SCHEDULED" | "SUSPENDED" | "%future added value";
import { FragmentRefs } from "relay-runtime";
export type ConversionIngestionStatus_query$data = {
  readonly cjCommissionIngestion: {
    readonly activity: {
      readonly attemptedAt: string | null;
      readonly scheduledAt: string | null;
      readonly state: CJCommissionIngestionActivityState;
    } | null;
    readonly credentials: {
      readonly accountIdConfigured: boolean;
      readonly apiTokenConfigured: boolean;
      readonly ready: boolean;
    };
    readonly latestFailure: {
      readonly finishedAt: string | null;
    } | null;
    readonly latestSuccess: {
      readonly finishedAt: string | null;
    } | null;
    readonly settings: {
      readonly nextRunAt: string | null;
    };
  };
  readonly " $fragmentType": "ConversionIngestionStatus_query";
};
export type ConversionIngestionStatus_query$key = {
  readonly " $data"?: ConversionIngestionStatus_query$data;
  readonly " $fragmentSpreads": FragmentRefs<"ConversionIngestionStatus_query">;
};

import ConversionIngestionStatusRefetchQuery_graphql from './ConversionIngestionStatusRefetchQuery.graphql';

const node: ReaderFragment = (function(){
var v0 = [
  {
    "alias": null,
    "args": null,
    "kind": "ScalarField",
    "name": "finishedAt",
    "storageKey": null
  }
];
return {
  "argumentDefinitions": [],
  "kind": "Fragment",
  "metadata": {
    "refetch": {
      "connection": null,
      "fragmentPathInResult": [],
      "operation": ConversionIngestionStatusRefetchQuery_graphql
    }
  },
  "name": "ConversionIngestionStatus_query",
  "selections": [
    {
      "alias": null,
      "args": null,
      "concreteType": "CJCommissionIngestion",
      "kind": "LinkedField",
      "name": "cjCommissionIngestion",
      "plural": false,
      "selections": [
        {
          "alias": null,
          "args": null,
          "concreteType": "CJCommissionIngestionSettings",
          "kind": "LinkedField",
          "name": "settings",
          "plural": false,
          "selections": [
            {
              "alias": null,
              "args": null,
              "kind": "ScalarField",
              "name": "nextRunAt",
              "storageKey": null
            }
          ],
          "storageKey": null
        },
        {
          "alias": null,
          "args": null,
          "concreteType": "CJCommissionCredentialStatus",
          "kind": "LinkedField",
          "name": "credentials",
          "plural": false,
          "selections": [
            {
              "alias": null,
              "args": null,
              "kind": "ScalarField",
              "name": "apiTokenConfigured",
              "storageKey": null
            },
            {
              "alias": null,
              "args": null,
              "kind": "ScalarField",
              "name": "accountIdConfigured",
              "storageKey": null
            },
            {
              "alias": null,
              "args": null,
              "kind": "ScalarField",
              "name": "ready",
              "storageKey": null
            }
          ],
          "storageKey": null
        },
        {
          "alias": null,
          "args": null,
          "concreteType": "CJCommissionIngestionActivity",
          "kind": "LinkedField",
          "name": "activity",
          "plural": false,
          "selections": [
            {
              "alias": null,
              "args": null,
              "kind": "ScalarField",
              "name": "state",
              "storageKey": null
            },
            {
              "alias": null,
              "args": null,
              "kind": "ScalarField",
              "name": "scheduledAt",
              "storageKey": null
            },
            {
              "alias": null,
              "args": null,
              "kind": "ScalarField",
              "name": "attemptedAt",
              "storageKey": null
            }
          ],
          "storageKey": null
        },
        {
          "alias": null,
          "args": null,
          "concreteType": "CJCommissionSyncRun",
          "kind": "LinkedField",
          "name": "latestSuccess",
          "plural": false,
          "selections": (v0/*:: as any*/),
          "storageKey": null
        },
        {
          "alias": null,
          "args": null,
          "concreteType": "CJCommissionSyncRun",
          "kind": "LinkedField",
          "name": "latestFailure",
          "plural": false,
          "selections": (v0/*:: as any*/),
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

(node as any).hash = "085fc8c28ba2ff9b58405de344c520c4";

export default node;

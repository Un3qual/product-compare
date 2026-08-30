/**
 * @generated SignedSource<<8d25869a6ef18a4596ea3cf98ce1ac7f>>
 * @lightSyntaxTransform
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ReaderFragment } from 'relay-runtime';
import { FragmentRefs } from "relay-runtime";
export type CommunityQuestionAnswers_question$data = {
  readonly acceptedAnswerId: string | null;
  readonly answers: {
    readonly edges: ReadonlyArray<{
      readonly node: {
        readonly id: string;
        readonly " $fragmentSpreads": FragmentRefs<"ProductCommunityItems_answer">;
      };
    }>;
  };
  readonly id: string;
  readonly " $fragmentType": "CommunityQuestionAnswers_question";
};
export type CommunityQuestionAnswers_question$key = {
  readonly " $data"?: CommunityQuestionAnswers_question$data;
  readonly " $fragmentSpreads": FragmentRefs<"CommunityQuestionAnswers_question">;
};

import CommunityQuestionAnswersPaginationQuery_graphql from './CommunityQuestionAnswersPaginationQuery.graphql';

const node: ReaderFragment = (function(){
var v0 = [
  "answers"
],
v1 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "id",
  "storageKey": null
};
return {
  "argumentDefinitions": [
    {
      "defaultValue": null,
      "kind": "LocalArgument",
      "name": "answerFirst"
    },
    {
      "defaultValue": null,
      "kind": "LocalArgument",
      "name": "answersAfter"
    }
  ],
  "kind": "Fragment",
  "metadata": {
    "connection": [
      {
        "count": "answerFirst",
        "cursor": "answersAfter",
        "direction": "forward",
        "path": (v0/*:: as any*/)
      }
    ],
    "refetch": {
      "connection": {
        "forward": {
          "count": "answerFirst",
          "cursor": "answersAfter"
        },
        "backward": null,
        "path": (v0/*:: as any*/)
      },
      "fragmentPathInResult": [
        "node"
      ],
      "operation": CommunityQuestionAnswersPaginationQuery_graphql,
      "identifierInfo": {
        "identifierField": "id",
        "identifierQueryVariableName": "id"
      }
    }
  },
  "name": "CommunityQuestionAnswers_question",
  "selections": [
    (v1/*:: as any*/),
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "acceptedAnswerId",
      "storageKey": null
    },
    {
      "alias": "answers",
      "args": null,
      "concreteType": "ProductAnswerConnection",
      "kind": "LinkedField",
      "name": "__CommunityQuestionAnswers_answers_connection",
      "plural": false,
      "selections": [
        {
          "alias": null,
          "args": null,
          "concreteType": "ProductAnswerEdge",
          "kind": "LinkedField",
          "name": "edges",
          "plural": true,
          "selections": [
            {
              "alias": null,
              "args": null,
              "concreteType": "ProductAnswer",
              "kind": "LinkedField",
              "name": "node",
              "plural": false,
              "selections": [
                (v1/*:: as any*/),
                {
                  "args": null,
                  "kind": "FragmentSpread",
                  "name": "ProductCommunityItems_answer"
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
  "type": "ProductQuestion",
  "abstractKey": null
};
})();

(node as any).hash = "2539f5070c9613f4c1c819acc798d2c4";

export default node;

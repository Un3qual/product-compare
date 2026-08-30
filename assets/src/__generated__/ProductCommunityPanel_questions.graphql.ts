/**
 * @generated SignedSource<<dde1bfa65226ac6df58348691c60126b>>
 * @lightSyntaxTransform
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ReaderFragment } from 'relay-runtime';
import { FragmentRefs } from "relay-runtime";
export type ProductCommunityPanel_questions$data = {
  readonly id: string;
  readonly questions: {
    readonly edges: ReadonlyArray<{
      readonly node: {
        readonly id: string;
        readonly " $fragmentSpreads": FragmentRefs<"CommunityQuestionAnswers_question" | "ProductCommunityItems_question">;
      };
    }>;
  };
  readonly " $fragmentType": "ProductCommunityPanel_questions";
};
export type ProductCommunityPanel_questions$key = {
  readonly " $data"?: ProductCommunityPanel_questions$data;
  readonly " $fragmentSpreads": FragmentRefs<"ProductCommunityPanel_questions">;
};

import ProductCommunityQuestionsPaginationQuery_graphql from './ProductCommunityQuestionsPaginationQuery.graphql';

const node: ReaderFragment = (function(){
var v0 = [
  "questions"
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
      "name": "questionFirst"
    },
    {
      "defaultValue": null,
      "kind": "LocalArgument",
      "name": "questionsAfter"
    }
  ],
  "kind": "Fragment",
  "metadata": {
    "connection": [
      {
        "count": "questionFirst",
        "cursor": "questionsAfter",
        "direction": "forward",
        "path": (v0/*:: as any*/)
      }
    ],
    "refetch": {
      "connection": {
        "forward": {
          "count": "questionFirst",
          "cursor": "questionsAfter"
        },
        "backward": null,
        "path": (v0/*:: as any*/)
      },
      "fragmentPathInResult": [
        "node"
      ],
      "operation": ProductCommunityQuestionsPaginationQuery_graphql,
      "identifierInfo": {
        "identifierField": "id",
        "identifierQueryVariableName": "id"
      }
    }
  },
  "name": "ProductCommunityPanel_questions",
  "selections": [
    {
      "alias": "questions",
      "args": null,
      "concreteType": "ProductQuestionConnection",
      "kind": "LinkedField",
      "name": "__ProductCommunityPanel_questions_connection",
      "plural": false,
      "selections": [
        {
          "alias": null,
          "args": null,
          "concreteType": "ProductQuestionEdge",
          "kind": "LinkedField",
          "name": "edges",
          "plural": true,
          "selections": [
            {
              "alias": null,
              "args": null,
              "concreteType": "ProductQuestion",
              "kind": "LinkedField",
              "name": "node",
              "plural": false,
              "selections": [
                (v1/*:: as any*/),
                {
                  "args": null,
                  "kind": "FragmentSpread",
                  "name": "ProductCommunityItems_question"
                },
                {
                  "args": [
                    {
                      "kind": "Variable",
                      "name": "answerFirst",
                      "variableName": "answerFirst"
                    }
                  ],
                  "kind": "FragmentSpread",
                  "name": "CommunityQuestionAnswers_question"
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
    },
    (v1/*:: as any*/)
  ],
  "type": "Product",
  "abstractKey": null
};
})();

(node as any).hash = "b814c228436220ca9f2367a2ec9aad45";

export default node;

/**
 * @generated SignedSource<<c4cf38ba7dbe4949d2e0f70ffeb5dad6>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type CouponDiscountType = "AMOUNT" | "FREE_SHIPPING" | "OTHER" | "PERCENT" | "%future added value";
export type CreateCouponInput = {
  affiliateNetworkId?: string | null;
  artifactId?: string | null;
  code: string;
  currency?: string | null;
  description?: string | null;
  discountType: CouponDiscountType;
  discountValue?: string | null;
  merchantId: string;
  terms?: string | null;
  validFrom?: string | null;
  validTo?: string | null;
};
export type AffiliateSetupOperationsCreateCouponMutation$variables = {
  input: CreateCouponInput;
};
export type AffiliateSetupOperationsCreateCouponMutation$data = {
  readonly createCoupon: {
    readonly coupon: {
      readonly affiliateNetworkId: string | null;
      readonly code: string;
      readonly currency: string | null;
      readonly discountType: CouponDiscountType;
      readonly discountValue: string | null;
      readonly id: string;
      readonly merchantId: string;
      readonly validFrom: string | null;
      readonly validTo: string | null;
    } | null;
    readonly errors: ReadonlyArray<{
      readonly code: string;
      readonly field: string | null;
      readonly message: string;
    }>;
  } | null;
};
export type AffiliateSetupOperationsCreateCouponMutation = {
  response: AffiliateSetupOperationsCreateCouponMutation$data;
  variables: AffiliateSetupOperationsCreateCouponMutation$variables;
};

const node: ConcreteRequest = (function(){
var v0 = [
  {
    "defaultValue": null,
    "kind": "LocalArgument",
    "name": "input"
  }
],
v1 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "code",
  "storageKey": null
},
v2 = [
  {
    "alias": null,
    "args": [
      {
        "kind": "Variable",
        "name": "input",
        "variableName": "input"
      }
    ],
    "concreteType": "CreateCouponPayload",
    "kind": "LinkedField",
    "name": "createCoupon",
    "plural": false,
    "selections": [
      {
        "alias": null,
        "args": null,
        "concreteType": "Coupon",
        "kind": "LinkedField",
        "name": "coupon",
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
            "name": "merchantId",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "affiliateNetworkId",
            "storageKey": null
          },
          (v1/*: any*/),
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "discountType",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "discountValue",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "currency",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "validFrom",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "validTo",
            "storageKey": null
          }
        ],
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
          (v1/*: any*/),
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
    "name": "AffiliateSetupOperationsCreateCouponMutation",
    "selections": (v2/*: any*/),
    "type": "RootMutationType",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "AffiliateSetupOperationsCreateCouponMutation",
    "selections": (v2/*: any*/)
  },
  "params": {
    "cacheID": "f2595db97ee5383769c3da4b3f6130cf",
    "id": null,
    "metadata": {},
    "name": "AffiliateSetupOperationsCreateCouponMutation",
    "operationKind": "mutation",
    "text": "mutation AffiliateSetupOperationsCreateCouponMutation(\n  $input: CreateCouponInput!\n) {\n  createCoupon(input: $input) {\n    coupon {\n      id\n      merchantId\n      affiliateNetworkId\n      code\n      discountType\n      discountValue\n      currency\n      validFrom\n      validTo\n    }\n    errors {\n      code\n      field\n      message\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "dc67def955ed05fbdc78fc27fdb6a26d";

export default node;

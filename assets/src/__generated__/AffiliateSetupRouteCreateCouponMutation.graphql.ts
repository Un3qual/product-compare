/**
 * @generated SignedSource<<d690c37ecd091f9c73a89d516accaf67>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type CouponDiscountType = "AMOUNT" | "FREE_SHIPPING" | "OTHER" | "PERCENT" | "%future added value";
export type CreateCouponInput = {
  affiliateNetworkId?: string | null | undefined;
  artifactId?: string | null | undefined;
  code: string;
  currency?: string | null | undefined;
  description?: string | null | undefined;
  discountType: CouponDiscountType;
  discountValue?: any | null | undefined;
  merchantId: string;
  terms?: string | null | undefined;
  validFrom?: any | null | undefined;
  validTo?: any | null | undefined;
};
export type AffiliateSetupRouteCreateCouponMutation$variables = {
  input: CreateCouponInput;
};
export type AffiliateSetupRouteCreateCouponMutation$data = {
  readonly createCoupon: {
    readonly coupon: {
      readonly affiliateNetworkId: string | null | undefined;
      readonly code: string;
      readonly currency: string | null | undefined;
      readonly discountType: CouponDiscountType;
      readonly discountValue: any | null | undefined;
      readonly id: string;
      readonly merchantId: string;
      readonly validFrom: any | null | undefined;
      readonly validTo: any | null | undefined;
    } | null | undefined;
    readonly errors: ReadonlyArray<{
      readonly code: string;
      readonly field: string | null | undefined;
      readonly message: string;
    }>;
  } | null | undefined;
};
export type AffiliateSetupRouteCreateCouponMutation = {
  response: AffiliateSetupRouteCreateCouponMutation$data;
  variables: AffiliateSetupRouteCreateCouponMutation$variables;
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
    "name": "AffiliateSetupRouteCreateCouponMutation",
    "selections": (v2/*: any*/),
    "type": "RootMutationType",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "AffiliateSetupRouteCreateCouponMutation",
    "selections": (v2/*: any*/)
  },
  "params": {
    "cacheID": "2bbcacb8f52379ff1f1ec6d3fecad879",
    "id": null,
    "metadata": {},
    "name": "AffiliateSetupRouteCreateCouponMutation",
    "operationKind": "mutation",
    "text": "mutation AffiliateSetupRouteCreateCouponMutation(\n  $input: CreateCouponInput!\n) {\n  createCoupon(input: $input) {\n    coupon {\n      id\n      merchantId\n      affiliateNetworkId\n      code\n      discountType\n      discountValue\n      currency\n      validFrom\n      validTo\n    }\n    errors {\n      code\n      field\n      message\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "5dc558eb7e86c2454ce36c17b9896029";

export default node;

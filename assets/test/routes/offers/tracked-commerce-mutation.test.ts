import { getRequest } from "relay-runtime";
import { trackCommerceClickMutation } from "../../../src/routes/offers/mutations/TrackCommerceClickMutation";

test("tracked commerce click mutation imports as a generated Relay request", () => {
  expect(getRequest(trackCommerceClickMutation).params.name).toBe("TrackCommerceClickMutation");
});

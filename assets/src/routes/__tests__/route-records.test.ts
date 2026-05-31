import { isRouteRecord } from "../route-records";

test("isRouteRecord accepts object-shaped route payloads", () => {
  expect(isRouteRecord({ id: "payload-1" })).toBe(true);
});

test("isRouteRecord rejects non-record route payloads", () => {
  expect(isRouteRecord(null)).toBe(false);
  expect(isRouteRecord(undefined)).toBe(false);
  expect(isRouteRecord("payload")).toBe(false);
  expect(isRouteRecord(42)).toBe(false);
  expect(isRouteRecord(["payload"])).toBe(false);
  expect(isRouteRecord(() => "payload")).toBe(false);
});

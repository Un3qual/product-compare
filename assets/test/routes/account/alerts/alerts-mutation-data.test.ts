import { DEFAULT_ROUTE_ERROR_MESSAGE } from "../../../../src/routes/route-errors";
import {
  buildDeletePriceWatchMutationVariables,
  buildMarkAlertReadMutationVariables,
  buildTogglePriceWatchMutationVariables,
  resolveDeletePriceWatchMutationError,
  resolveMarkAlertReadMutationError,
  resolveTogglePriceWatchMutationError
} from "../../../../src/routes/account/alerts/alerts-mutation-data";

const MUTATION_ERROR = {
  code: "INVALID_ARGUMENT",
  field: "id",
  message: "This alert is no longer available."
};

test("buildTogglePriceWatchMutationVariables inverts enabled without changing the watch", () => {
  const watch = { id: "watch-1", enabled: true };

  const variables = buildTogglePriceWatchMutationVariables(watch);

  expect(variables).toEqual({ input: { id: "watch-1", enabled: false } });
  expect(variables).not.toBe(watch);
  expect(variables.input).not.toBe(watch);
  expect(watch).toEqual({ id: "watch-1", enabled: true });
});

test("buildDeletePriceWatchMutationVariables returns the exact delete shape without changing the watch", () => {
  const watch = { id: "watch-1", enabled: false };

  const variables = buildDeletePriceWatchMutationVariables(watch);

  expect(variables).toEqual({ id: "watch-1" });
  expect(variables).not.toBe(watch);
  expect(watch).toEqual({ id: "watch-1", enabled: false });
});

test("buildMarkAlertReadMutationVariables returns the exact mark-read shape without changing the alert", () => {
  const alert = { id: "alert-1", readAt: null };

  const variables = buildMarkAlertReadMutationVariables(alert);

  expect(variables).toEqual({ id: "alert-1" });
  expect(variables).not.toBe(alert);
  expect(alert).toEqual({ id: "alert-1", readAt: null });
});

test("operation resolvers return no error only for their expected truthy success result", () => {
  expect(resolveTogglePriceWatchMutationError({ watch: { id: "watch-1" }, errors: [MUTATION_ERROR] }, [])).toBeNull();
  expect(resolveDeletePriceWatchMutationError({ deletedWatchId: "watch-1", errors: [MUTATION_ERROR] }, [])).toBeNull();
  expect(resolveMarkAlertReadMutationError({ event: { id: "alert-1" }, errors: [MUTATION_ERROR] }, [])).toBeNull();
});

test.each([
  ["toggle", () => resolveTogglePriceWatchMutationError({ watch: null, errors: [MUTATION_ERROR] }, [])],
  ["delete", () => resolveDeletePriceWatchMutationError({ deletedWatchId: "", errors: [MUTATION_ERROR] }, [])],
  ["mark read", () => resolveMarkAlertReadMutationError({ event: null, errors: [MUTATION_ERROR] }, [])]
])("%s payload failures preserve the shared mutation-error copy", (_operation, resolveError) => {
  expect(resolveError()).toBe(MUTATION_ERROR.message);
});

test.each([
  ["toggle", () => resolveTogglePriceWatchMutationError({ watch: null, errors: [MUTATION_ERROR] }, [{ message: "Transport failure" }])],
  ["delete", () => resolveDeletePriceWatchMutationError({ deletedWatchId: null, errors: [MUTATION_ERROR] }, [{ message: "Transport failure" }])],
  ["mark read", () => resolveMarkAlertReadMutationError({ event: null, errors: [MUTATION_ERROR] }, [{ message: "Transport failure" }])]
])("%s GraphQL failures use the shared fallback copy", (_operation, resolveError) => {
  expect(resolveError()).toBe(DEFAULT_ROUTE_ERROR_MESSAGE);
});

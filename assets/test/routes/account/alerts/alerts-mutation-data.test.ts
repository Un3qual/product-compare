import { DEFAULT_MUTATION_ERROR_MESSAGE } from "../../../../src/relay/mutation-errors";
import { resolveMarkAlertReadMutationError } from "../../../../src/routes/account/alerts/alert-rows/alert-event-mutation-result";
import {
  resolveDeletePriceWatchMutationError,
  resolveTogglePriceWatchMutationError,
} from "../../../../src/routes/account/alerts/watches/price-watch-mutation-results";

const MUTATION_ERROR = {
  code: "INVALID_ARGUMENT",
  field: "id",
  message: "This alert is no longer available.",
};

test("operation resolvers return no error only for their expected truthy success result", () => {
  expect(
    resolveTogglePriceWatchMutationError(
      { watch: { id: "watch-1", enabled: true }, errors: [MUTATION_ERROR] },
      [],
    ),
  ).toBeNull();
  expect(
    resolveDeletePriceWatchMutationError(
      { deletedWatchId: "watch-1", errors: [MUTATION_ERROR] },
      [],
    ),
  ).toBeNull();
  expect(
    resolveMarkAlertReadMutationError(
      { event: { id: "alert-1", readAt: "2026-08-12T12:00:00Z" }, errors: [MUTATION_ERROR] },
      [],
    ),
  ).toBeNull();
});

test.each([
  [
    "toggle",
    () => resolveTogglePriceWatchMutationError({ watch: null, errors: [MUTATION_ERROR] }, []),
  ],
  [
    "delete",
    () =>
      resolveDeletePriceWatchMutationError({ deletedWatchId: "", errors: [MUTATION_ERROR] }, []),
  ],
  [
    "mark read",
    () => resolveMarkAlertReadMutationError({ event: null, errors: [MUTATION_ERROR] }, []),
  ],
])("%s payload failures preserve the shared mutation-error copy", (_operation, resolveError) => {
  expect(resolveError()).toBe(MUTATION_ERROR.message);
});

test.each([
  [
    "toggle",
    () =>
      resolveTogglePriceWatchMutationError({ watch: null, errors: [MUTATION_ERROR] }, [
        { message: "Transport failure" },
      ]),
  ],
  [
    "delete",
    () =>
      resolveDeletePriceWatchMutationError({ deletedWatchId: null, errors: [MUTATION_ERROR] }, [
        { message: "Transport failure" },
      ]),
  ],
  [
    "mark read",
    () =>
      resolveMarkAlertReadMutationError({ event: null, errors: [MUTATION_ERROR] }, [
        { message: "Transport failure" },
      ]),
  ],
])("%s GraphQL failures use the shared fallback copy", (_operation, resolveError) => {
  expect(resolveError()).toBe(DEFAULT_MUTATION_ERROR_MESSAGE);
});

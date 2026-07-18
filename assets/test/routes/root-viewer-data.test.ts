import { projectRootViewer } from "../../src/routes/root/viewer-data";

test.each([null, undefined])("projects no viewer for a nullish value", (viewer) => {
  expect(projectRootViewer(viewer)).toBeNull();
});

test("projects no viewer for primitive values", () => {
  for (const viewer of ["viewer", 42, true, Symbol("viewer")]) {
    expect(projectRootViewer(viewer)).toBeNull();
  }
});

test.each([
  ["missing email", { id: "viewer-1", isOperator: false }],
  ["missing id", { email: "person@example.com", isOperator: false }],
  ["missing operator state", { id: "viewer-1", email: "person@example.com" }],
  ["numeric id", { id: 1, email: "person@example.com", isOperator: false }],
  ["null id", { id: null, email: "person@example.com", isOperator: false }],
  ["numeric email", { id: "viewer-1", email: 1, isOperator: false }],
  ["null email", { id: "viewer-1", email: null, isOperator: false }],
  ["non-boolean operator state", { id: "viewer-1", email: "person@example.com", isOperator: "false" }]
])("projects no viewer for an incomplete or invalid viewer with %s", (_, viewer) => {
  expect(projectRootViewer(viewer)).toBeNull();
});

test("projects the exact valid viewer fields", () => {
  expect(
    projectRootViewer({
      id: "viewer-1",
      email: "person@example.com",
      isOperator: true
    })
  ).toEqual({
    id: "viewer-1",
    email: "person@example.com",
    isOperator: true
  });
});

test("does not mutate a valid viewer input", () => {
  const viewer = {
    id: "viewer-1",
    email: "person@example.com",
    isOperator: false,
    extra: "preserved"
  };
  const before = { ...viewer };

  const projected = projectRootViewer(viewer);

  expect(viewer).toEqual(before);
  expect(projected).not.toBe(viewer);
});

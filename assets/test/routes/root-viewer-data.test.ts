import { projectRootViewer } from "../../src/routes/root/viewer-data";

test("projects no viewer for nullish values", () => {
  expect(projectRootViewer(null)).toBeNull();
  expect(projectRootViewer(undefined)).toBeNull();
});

test("projects no viewer for primitive values", () => {
  for (const viewer of ["viewer", 42, true, Symbol("viewer")]) {
    expect(projectRootViewer(viewer)).toBeNull();
  }
});

test("projects no viewer for incomplete viewer values", () => {
  expect(projectRootViewer({ id: "viewer-1", email: "person@example.com" })).toBeNull();
  expect(projectRootViewer({ id: "viewer-1", isOperator: false })).toBeNull();
  expect(projectRootViewer({ email: "person@example.com", isOperator: false })).toBeNull();
  expect(
    projectRootViewer({
      id: "viewer-1",
      email: "person@example.com",
      isOperator: "false"
    })
  ).toBeNull();
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

import { routeFormValue } from "../../src/frontend/forms/route-form";

test("routeFormValue reads string form values", () => {
  const formData = new FormData();

  formData.set("email", "person@example.com");

  expect(routeFormValue(formData, "email")).toBe("person@example.com");
});

test("routeFormValue defaults missing and non-string values to an empty string", () => {
  const formData = new FormData();
  const file = new File(["avatar"], "avatar.png", { type: "image/png" });

  formData.set("avatar", file);

  expect(routeFormValue(formData, "missing")).toBe("");
  expect(routeFormValue(formData, "avatar")).toBe("");
});

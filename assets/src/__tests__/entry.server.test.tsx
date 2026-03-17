import { render } from "../entry.server";

test("server render returns a promise that resolves to app markup", async () => {
  const html = render("/");

  expect(html).toBeInstanceOf(Promise);
  await expect(html).resolves.toContain("Product Compare");
});

test("server render resolves auth route markup", async () => {
  await expect(render("/auth/login")).resolves.toContain("Sign in");
});

test("server render resolves recovery route markup", async () => {
  await expect(render("/auth/forgot-password")).resolves.toContain("Reset your password");
});

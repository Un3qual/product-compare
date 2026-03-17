import { render } from "../entry.server";

test("server render returns a promise that resolves to app markup", async () => {
  const html = render("/");

  expect(html).toBeInstanceOf(Promise);
  await expect(html).resolves.toContain("Product Compare");
});

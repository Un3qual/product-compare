import { fetchQuery } from "relay-runtime";
import productDetailRouteQuery from "../../__generated__/ProductDetailRouteQuery.graphql";
import { fetchGraphQL } from "../fetch-graphql";
import { createRelayEnvironment } from "../environment";

const { fetchGraphQLMock } = vi.hoisted(() => ({
  fetchGraphQLMock: vi.fn()
}));

vi.mock("../fetch-graphql", () => ({
  fetchGraphQL: fetchGraphQLMock
}));

beforeEach(() => {
  fetchGraphQLMock.mockReset();
});

test("Relay environment asks fetchGraphQL to reject top-level GraphQL errors", async () => {
  const environment = createRelayEnvironment();

  fetchGraphQLMock.mockResolvedValue({
    data: {
      product: null
    }
  });

  await fetchQuery(environment, productDetailRouteQuery, {
    slug: "detail-product"
  }).toPromise();

  expect(fetchGraphQL).toHaveBeenCalledWith(
    expect.stringContaining("query ProductDetailRouteQuery"),
    { slug: "detail-product" },
    expect.objectContaining({
      rejectGraphQLErrors: true
    })
  );
});

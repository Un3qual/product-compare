import { resolveGraphQLEndpoint } from "../../relay/fetch-graphql";

type CommerceClick = {
  button: number;
  altKey: boolean;
  ctrlKey: boolean;
  metaKey: boolean;
  shiftKey: boolean;
};

export function shouldTrackCommerceClick(click: CommerceClick) {
  return (
    click.button === 0 &&
    !click.altKey &&
    !click.ctrlKey &&
    !click.metaKey &&
    !click.shiftKey
  );
}

export function trackedMerchantProductHref(
  merchantProductId: string,
  graphQLEndpoint = resolveGraphQLEndpoint()
) {
  const params = new URLSearchParams({ merchantProductId });

  return resolveTrackedCommerceRedirectUrl(`/r/merchant-product?${params.toString()}`, graphQLEndpoint);
}

export function resolveTrackedCommerceRedirectUrl(
  redirectPath: string,
  graphQLEndpoint = resolveGraphQLEndpoint()
) {
  const endpointUrl = new URL(graphQLEndpoint);
  const redirectUrl = new URL(redirectPath, endpointUrl.origin);

  if (redirectUrl.origin !== endpointUrl.origin) {
    throw new Error("Tracked commerce redirect must resolve to the same origin");
  }

  return redirectUrl.toString();
}

import { Suspense } from "react";
import { Link, useLoaderData } from "react-router-dom";
import { usePreloadedQuery } from "react-relay";
import merchantDirectoryRouteQuery, {
  type MerchantDirectoryRouteQuery
} from "../../__generated__/MerchantDirectoryRouteQuery.graphql";
import { useRoutePreloadedQuery } from "../../relay/route-preload";
import { ResettableErrorBoundary } from "../../relay/resettable-error-boundary";
import {
  merchantDirectoryLoader,
  type MerchantDirectoryLoaderData,
  type MerchantDirectoryPagination
} from "./loader";
import { merchantDirectoryPagePath } from "./pagination";

type MerchantDirectoryConnection = NonNullable<
  MerchantDirectoryRouteQuery["response"]["merchants"]
>;

export function MerchantDirectoryRoute() {
  const loaderData = useLoaderData<typeof merchantDirectoryLoader>() as MerchantDirectoryLoaderData;

  return (
    <section>
      <header>
        <h1>Merchants</h1>
      </header>

      {loaderData.status === "error" ? (
        <MerchantDirectoryUnavailableFallback />
      ) : (
        <>
          <MerchantDirectoryControls pagination={loaderData.pagination} />
          <ResettableErrorBoundary
            fallback={<MerchantDirectoryUnavailableFallback />}
            resetToken={loaderData.query}
          >
            <Suspense fallback={<p role="status">Loading merchants...</p>}>
              <MerchantDirectoryPanel
                pagination={loaderData.pagination}
                query={loaderData.query}
              />
            </Suspense>
          </ResettableErrorBoundary>
        </>
      )}
    </section>
  );
}

function MerchantDirectoryControls({
  pagination
}: {
  pagination: MerchantDirectoryPagination;
}) {
  return (
    <form action="/merchants" method="get">
      <label>
        Page size
        <select key={pagination.first} name="first" defaultValue={String(pagination.first)}>
          <option value="20">20</option>
          <option value="35">35</option>
          <option value="50">50</option>
        </select>
      </label>
      <button type="submit">Apply</button>
    </form>
  );
}

function MerchantDirectoryPanel({
  pagination,
  query
}: {
  pagination: MerchantDirectoryPagination;
  query: Extract<MerchantDirectoryLoaderData, { status: "ready" }>["query"];
}) {
  const queryRef = useRoutePreloadedQuery<MerchantDirectoryRouteQuery>(
    merchantDirectoryRouteQuery,
    query
  );
  const data = usePreloadedQuery<MerchantDirectoryRouteQuery>(
    merchantDirectoryRouteQuery,
    queryRef
  );

  if (!data.merchants) {
    return <MerchantDirectoryUnavailableFallback />;
  }

  return <MerchantDirectoryList connection={data.merchants} pagination={pagination} />;
}

function MerchantDirectoryList({
  connection,
  pagination
}: {
  connection: MerchantDirectoryConnection;
  pagination: MerchantDirectoryPagination;
}) {
  const merchants = connection.edges.map(({ node }) => node);

  if (merchants.length === 0) {
    return <p>No merchants available yet.</p>;
  }

  return (
    <>
      <ul aria-label="Merchants">
        {merchants.map((merchant) => {
          const websiteHref = merchantWebsiteHref(merchant.domain);

          return (
            <li key={merchant.id}>
              <h2>{merchant.name}</h2>
              <p>{merchant.domain}</p>
              {websiteHref ? (
                <p>
                  <a href={websiteHref} target="_blank" rel="noopener noreferrer">
                    Visit merchant website
                  </a>
                </p>
              ) : null}
            </li>
          );
        })}
      </ul>
      {connection.pageInfo.hasPreviousPage && pagination.after ? (
        <p>
          <Link to={merchantDirectoryPagePath(pagination)}>First merchants</Link>
        </p>
      ) : null}
      {connection.pageInfo.hasNextPage && connection.pageInfo.endCursor ? (
        <p>
          <Link to={merchantDirectoryPagePath(pagination, connection.pageInfo.endCursor)}>
            Next merchants
          </Link>
        </p>
      ) : null}
    </>
  );
}

function merchantWebsiteHref(domain: string) {
  const value = domain.trim();

  if (value.length === 0) {
    return null;
  }

  if (hasAbsoluteUrlScheme(value)) {
    return isHttpWebsiteUrl(value) ? value : null;
  }

  if (!isHostnameShapedBareDomain(value)) {
    return null;
  }

  const normalizedHref = `https://${value}`;

  return isHttpWebsiteUrl(normalizedHref) ? normalizedHref : null;
}

function isHttpWebsiteUrl(value: string) {
  if (hasMalformedHttpAuthority(value)) {
    return false;
  }

  try {
    const url = new URL(value);

    return (
      (url.protocol === "http:" || url.protocol === "https:") &&
      url.hostname.length > 0 &&
      url.username.length === 0 &&
      url.password.length === 0
    );
  } catch {
    return false;
  }
}

function hasAbsoluteUrlScheme(value: string) {
  const separatorIndex = value.indexOf("://");

  if (separatorIndex <= 0) {
    return false;
  }

  for (let index = 0; index < separatorIndex; index += 1) {
    if (!isSchemeCharacter(value[index], index)) {
      return false;
    }
  }

  return true;
}

function hasMalformedHttpAuthority(value: string) {
  const lowerValue = value.toLowerCase();
  const authorityStart =
    lowerValue.startsWith("https://") ? "https://".length : "http://".length;

  return (
    (lowerValue.startsWith("https://") || lowerValue.startsWith("http://")) &&
    (value[authorityStart] === "/" || value[authorityStart] === "\\")
  );
}

function isHostnameShapedBareDomain(value: string) {
  if (
    value.includes("/") ||
    value.includes("\\") ||
    value.includes("@") ||
    value.includes("?") ||
    value.includes("#")
  ) {
    return false;
  }

  const parsedDomain = parseBareDomain(value);

  if (!parsedDomain) {
    return false;
  }

  const labels = parsedDomain.hostname.split(".");

  return labels.length >= 2 && labels.every(isValidHostnameLabel);
}

function parseBareDomain(value: string) {
  const colonIndex = value.lastIndexOf(":");

  if (colonIndex === -1) {
    return { hostname: value };
  }

  if (value.indexOf(":") !== colonIndex) {
    return null;
  }

  const hostname = value.slice(0, colonIndex);
  const port = value.slice(colonIndex + 1);

  if (!isValidPort(port)) {
    return null;
  }

  return { hostname };
}

function isValidHostnameLabel(label: string) {
  if (
    label.length === 0 ||
    label.length > 63 ||
    label.startsWith("-") ||
    label.endsWith("-")
  ) {
    return false;
  }

  for (const character of label) {
    if (!isAsciiLetterOrDigit(character) && character !== "-") {
      return false;
    }
  }

  return true;
}

function isValidPort(port: string) {
  if (port.length === 0 || port.length > 5) {
    return false;
  }

  for (const character of port) {
    if (!isDigit(character)) {
      return false;
    }
  }

  const portNumber = Number(port);

  return portNumber > 0 && portNumber <= 65_535;
}

function isSchemeCharacter(character: string, index: number) {
  if (index === 0) {
    return isAsciiLetter(character);
  }

  return (
    isAsciiLetter(character) ||
    isDigit(character) ||
    character === "+" ||
    character === "." ||
    character === "-"
  );
}

function isAsciiLetterOrDigit(character: string) {
  return isAsciiLetter(character) || isDigit(character);
}

function isAsciiLetter(character: string) {
  const codePoint = character.charCodeAt(0);

  return (
    (codePoint >= "A".charCodeAt(0) && codePoint <= "Z".charCodeAt(0)) ||
    (codePoint >= "a".charCodeAt(0) && codePoint <= "z".charCodeAt(0))
  );
}

function isDigit(character: string) {
  const codePoint = character.charCodeAt(0);

  return codePoint >= "0".charCodeAt(0) && codePoint <= "9".charCodeAt(0);
}

function MerchantDirectoryUnavailableFallback() {
  return (
    <section role="alert">
      <p>Merchant directory unavailable.</p>
    </section>
  );
}

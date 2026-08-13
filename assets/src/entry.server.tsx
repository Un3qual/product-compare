import { renderToReadableStream } from "react-dom/server";
import { createHead, UnheadProvider } from "@unhead/react/server";
import { createStaticHandler, createStaticRouter, StaticRouterProvider } from "react-router-dom";
import { RelayEnvironmentProvider } from "react-relay";
import "./ui/theme/tokens.stylex";
import {
  createServerRequest,
  insertDocumentBootstrap,
  responseHeadersFromContext,
  waitForAllReady,
  type ReactReadableStream,
} from "./frontend/ssr";
import { createRelayEnvironment } from "./relay/environment";
import type { SSRContext } from "./relay/fetch-graphql";
import { createRelayRouterContext } from "./relay/route-preload";
import { dehydrateRelayEnvironment, renderRelayRecordsScript } from "./relay/ssr";
import { routes } from "./router";

export async function render(url: string, ssrContext?: SSRContext): Promise<Response | string> {
  const relayEnvironment = createRelayEnvironment({ ssrContext });
  const head = createHead({ disableDefaults: true });
  const handler = createStaticHandler(routes);
  const context = await handler.query(createServerRequest(url, ssrContext), {
    requestContext: createRelayRouterContext(relayEnvironment),
  });

  if (context instanceof Response) {
    return context;
  }

  const router = createStaticRouter(handler.dataRoutes, context);

  const htmlStream: ReactReadableStream = await renderToReadableStream(
    <UnheadProvider value={head}>
      <RelayEnvironmentProvider environment={relayEnvironment}>
        <StaticRouterProvider router={router} context={context} />
      </RelayEnvironmentProvider>
    </UnheadProvider>,
    {
      onError(error) {
        console.error(error);
      },
    },
  );

  await waitForAllReady(htmlStream);

  const appHtml = await new Response(htmlStream).text();
  const relayRecordsScript = renderRelayRecordsScript(dehydrateRelayEnvironment(relayEnvironment));
  const renderedHtml = insertDocumentBootstrap(appHtml, head.render().headTags, relayRecordsScript);

  const statusCode = context.statusCode ?? 200;

  if (statusCode !== 200) {
    const responseHeaders = responseHeadersFromContext(
      context.loaderHeaders,
      context.actionHeaders,
    );
    responseHeaders.set("Content-Type", "text/html; charset=utf-8");

    return new Response(renderedHtml, {
      headers: responseHeaders,
      status: statusCode,
    });
  }

  return renderedHtml;
}

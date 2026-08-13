export function responseHeadersFromContext(
  loaderHeaders: Record<string, Headers> = {},
  actionHeaders: Record<string, Headers> = {},
) {
  const responseHeaders = new Headers();

  for (const routeHeaders of [...Object.values(loaderHeaders), ...Object.values(actionHeaders)]) {
    routeHeaders.forEach((value, key) => {
      responseHeaders.append(key, value);
    });
  }

  return responseHeaders;
}

export function insertDocumentBootstrap(
  appHtml: string,
  headTags: string,
  relayRecordsScript: string,
) {
  return insertRelayRecordsScript(insertHeadTags(appHtml, headTags), relayRecordsScript);
}

function insertHeadTags(appHtml: string, headTags: string) {
  if (!headTags) return appHtml;

  const headCloseIndex = appHtml.toLowerCase().lastIndexOf("</head>");

  if (headCloseIndex === -1) {
    return `${headTags}${appHtml}`;
  }

  return `${appHtml.slice(0, headCloseIndex)}${headTags}${appHtml.slice(headCloseIndex)}`;
}

function insertRelayRecordsScript(appHtml: string, relayRecordsScript: string) {
  const bodyCloseIndex = appHtml.toLowerCase().lastIndexOf("</body>");

  if (bodyCloseIndex === -1) {
    return `${appHtml}${relayRecordsScript}`;
  }

  return `${appHtml.slice(0, bodyCloseIndex)}${relayRecordsScript}${appHtml.slice(bodyCloseIndex)}`;
}

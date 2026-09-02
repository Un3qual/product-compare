import type { Environment } from "relay-runtime";
import type { RelayRecordMap } from "./environment";

const RELAY_RECORDS_SCRIPT_ID = "__relayRecords";
const JSON_HTML_ESCAPES: Record<string, string> = {
  "<": "\\u003c",
  ">": "\\u003e",
  "&": "\\u0026",
  "\u2028": "\\u2028",
  "\u2029": "\\u2029",
};

export function dehydrateRelayEnvironment(environment: Environment): RelayRecordMap {
  return environment.getStore().getSource().toJSON();
}

export function serializeRelayRecords(records: RelayRecordMap) {
  return escapeJsonForHtml(JSON.stringify({ records }));
}

export function readRelayRecordsFromDocument(documentRef: Document = document): RelayRecordMap {
  const element = documentRef.getElementById(RELAY_RECORDS_SCRIPT_ID);

  if (!element?.textContent) {
    return {};
  }

  try {
    const parsed: unknown = JSON.parse(element.textContent);
    if (!parsed || typeof parsed !== "object" || !("records" in parsed)) return {};

    return isRelayRecordMap(parsed.records) ? parsed.records : {};
  } catch {
    return {};
  }
}

function escapeJsonForHtml(json: string) {
  return json.replace(
    /[<>&\u2028\u2029]/gu,
    (character) => JSON_HTML_ESCAPES[character] ?? character,
  );
}

function isRelayRecordMap(value: unknown): value is RelayRecordMap {
  return Boolean(
    value &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    Object.values(value).every(
      (record) => record == null || (typeof record === "object" && !Array.isArray(record)),
    ),
  );
}

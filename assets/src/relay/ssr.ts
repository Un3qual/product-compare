import type { Environment } from "relay-runtime";
import type { RelayRecordMap } from "./environment";

const RELAY_RECORDS_SCRIPT_ID = "__relayRecords";

interface RelayRecordsBootstrap {
  records: RelayRecordMap;
}

export function dehydrateRelayEnvironment(environment: Environment): RelayRecordMap {
  return environment.getStore().getSource().toJSON();
}

export function renderRelayRecordsScript(records: RelayRecordMap) {
  const payload: RelayRecordsBootstrap = { records };

  return `<script id="${RELAY_RECORDS_SCRIPT_ID}" type="application/json">${escapeJsonForHtml(
    JSON.stringify(payload)
  )}</script>`;
}

export function readRelayRecordsFromDocument(documentRef: Document = document): RelayRecordMap {
  const element = documentRef.getElementById(RELAY_RECORDS_SCRIPT_ID);

  if (!element?.textContent) {
    return {};
  }

  try {
    const parsed = JSON.parse(element.textContent) as Partial<RelayRecordsBootstrap>;

    return isRelayRecordMap(parsed.records) ? parsed.records : {};
  } catch {
    return {};
  }
}

function escapeJsonForHtml(json: string) {
  return json.replace(/[<>&\u2028\u2029]/gu, (character) => {
    switch (character) {
      case "<":
        return "\\u003c";
      case ">":
        return "\\u003e";
      case "&":
        return "\\u0026";
      case "\u2028":
        return "\\u2028";
      case "\u2029":
        return "\\u2029";
      default:
        return character;
    }
  });
}

function isRelayRecordMap(value: unknown): value is RelayRecordMap {
  return Boolean(
    value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      Object.values(value).every(
        (record) => record == null || (typeof record === "object" && !Array.isArray(record))
      )
  );
}

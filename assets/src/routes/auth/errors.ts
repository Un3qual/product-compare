export interface MutationError {
  code: string;
  field?: string | null;
  message: string;
}

interface Viewer {
  id: string;
  email: string;
}

export interface AuthSessionResult {
  viewer: Viewer | null;
  errors: MutationError[];
}

export interface AuthActionResult {
  ok: boolean;
  errors: MutationError[];
}

const transportErrorMessage = "Request failed. Please try again.";

export function findMutationError(errors: MutationError[], field: string) {
  return errors.find((error) => error.field === field)?.message ?? null;
}

export function sanitizeTransportError(_error: unknown) {
  return transportErrorMessage;
}

export function transportMutationError(error: unknown): MutationError {
  return {
    code: "NETWORK_ERROR",
    field: null,
    message: sanitizeTransportError(error)
  };
}

export function normalizeSessionPayload(payload: unknown): AuthSessionResult {
  const sessionPayload = isRecord(payload) ? payload : {};
  const viewer = isViewer(sessionPayload.viewer) ? sessionPayload.viewer : null;
  const errors = normalizeErrors(sessionPayload.errors);

  return {
    viewer,
    errors: viewer ? errors : ensureFailureErrors(errors)
  };
}

export function normalizeActionPayload(payload: unknown): AuthActionResult {
  const actionPayload = isRecord(payload) ? payload : {};
  const ok = actionPayload.ok === true;
  const errors = normalizeErrors(actionPayload.errors);

  return {
    ok,
    errors: ok ? errors : ensureFailureErrors(errors)
  };
}

function normalizeErrors(payloadErrors: unknown): MutationError[] {
  if (Array.isArray(payloadErrors)) {
    const typedErrors = payloadErrors.filter(isMutationError);

    if (typedErrors.length > 0) {
      return typedErrors;
    }
  }

  return [];
}

function ensureFailureErrors(errors: MutationError[]) {
  if (errors.length > 0) {
    return errors;
  }

  return [
    {
      code: "UNKNOWN_ERROR",
      field: null,
      message: transportErrorMessage
    }
  ];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function isMutationError(value: unknown): value is MutationError {
  if (!isRecord(value)) {
    return false;
  }

  return Boolean(
    typeof value.code === "string" &&
      typeof value.message === "string" &&
      (value.field === undefined ||
        value.field === null ||
        typeof value.field === "string")
  );
}

function isViewer(value: unknown): value is Viewer {
  return Boolean(
    isRecord(value) &&
      typeof value.id === "string" &&
      typeof value.email === "string"
  );
}

import { nextRelayPageCursor } from "../../relay-pagination";
import {
  CJ_PROGRAM_SORTS,
  CJ_PROGRAM_STAGES,
  type CJProgramSort,
  type CJProgramStage
} from "./cj-program-data";

const DEFAULT_PROGRAM_PAGE_SIZE = 20;
const DEFAULT_UNMATCHED_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 50;

export interface CJProgramsPagination {
  first: number;
  after: string | null;
  stage: CJProgramStage | null;
  sort: CJProgramSort;
  unmatchedFirst: number;
  unmatchedAfter: string | null;
}

type ConnectionPageInfo = Readonly<{
  endCursor: string | null;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}>;

export function cjProgramsPaginationFromUrl(url: URL): CJProgramsPagination {
  return {
    first: normalizePageSize(url.searchParams.get("first"), DEFAULT_PROGRAM_PAGE_SIZE),
    after: normalizeCursor(url.searchParams.get("after")),
    stage: normalizeStage(url.searchParams.get("stage")),
    sort: normalizeSort(url.searchParams.get("sort")),
    unmatchedFirst: normalizePageSize(
      url.searchParams.get("unmatchedFirst"),
      DEFAULT_UNMATCHED_PAGE_SIZE
    ),
    unmatchedAfter: normalizeCursor(url.searchParams.get("unmatchedAfter"))
  };
}

export function cjProgramStageToUrlParam(stage: CJProgramStage) {
  return CJ_PROGRAM_STAGES.find(({ value }) => value === stage)?.urlValue ?? "new";
}

export function cjProgramSortToUrlParam(sort: CJProgramSort) {
  return CJ_PROGRAM_SORTS.find(({ value }) => value === sort)?.urlValue ?? "name_asc";
}

function cjProgramsPath(pagination: Readonly<CJProgramsPagination>) {
  const params = new URLSearchParams();

  params.set("first", String(pagination.first));

  if (pagination.after) {
    params.set("after", pagination.after);
  }

  if (pagination.stage) {
    params.set("stage", cjProgramStageToUrlParam(pagination.stage));
  }

  params.set("sort", cjProgramSortToUrlParam(pagination.sort));
  params.set("unmatchedFirst", String(pagination.unmatchedFirst));

  if (pagination.unmatchedAfter) {
    params.set("unmatchedAfter", pagination.unmatchedAfter);
  }

  return `/ingestion/cj-programs?${params.toString()}`;
}

export function buildCJProgramPaginationData(
  pagination: Readonly<CJProgramsPagination>,
  {
    program,
    unmatched
  }: {
    readonly program: ConnectionPageInfo;
    readonly unmatched: ConnectionPageInfo;
  }
) {
  const programNextCursor = nextRelayPageCursor(program, pagination.after);
  const unmatchedNextCursor = nextRelayPageCursor(
    unmatched,
    pagination.unmatchedAfter
  );

  return {
    program: {
      firstHref:
        program.hasPreviousPage && pagination.after
          ? cjProgramsPath({ ...pagination, after: null })
          : null,
      nextHref: programNextCursor
        ? cjProgramsPath({ ...pagination, after: programNextCursor })
        : null
    },
    unmatched: {
      firstHref:
        unmatched.hasPreviousPage && pagination.unmatchedAfter
          ? cjProgramsPath({ ...pagination, unmatchedAfter: null })
          : null,
      nextHref: unmatchedNextCursor
        ? cjProgramsPath({ ...pagination, unmatchedAfter: unmatchedNextCursor })
        : null
    }
  };
}

function normalizePageSize(value: string | null, defaultValue: number) {
  const normalized = value?.trim();

  if (!normalized || !/^\d+$/.test(normalized)) {
    return defaultValue;
  }

  const pageSize = Number(normalized);

  return pageSize >= 1 && pageSize <= MAX_PAGE_SIZE ? pageSize : defaultValue;
}

function normalizeCursor(value: string | null) {
  const normalized = value?.trim();

  return normalized ? normalized : null;
}

function normalizeStage(value: string | null): CJProgramStage | null {
  const normalized = value?.trim().toLowerCase();
  return CJ_PROGRAM_STAGES.find(({ urlValue }) => urlValue === normalized)?.value ?? null;
}

function normalizeSort(value: string | null): CJProgramSort {
  const normalized = value?.trim().toLowerCase();
  return CJ_PROGRAM_SORTS.find(({ urlValue }) => urlValue === normalized)?.value ?? "NAME_ASC";
}

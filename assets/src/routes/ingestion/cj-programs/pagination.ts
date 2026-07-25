import { nextRelayPageCursor } from "../../relay-pagination";

const DEFAULT_PROGRAM_PAGE_SIZE = 20;
const DEFAULT_UNMATCHED_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 50;

export type CJProgramStage =
  | "NEW"
  | "CONSIDERING"
  | "SELECTED"
  | "APPLIED"
  | "ACCEPTED"
  | "NOT_PURSUING"
  | "DECLINED";

export type CJProgramSort =
  | "NAME_ASC"
  | "LAST_CHANGED_DESC"
  | "FEED_COUNT_DESC";

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
  switch (stage) {
    case "CONSIDERING":
      return "considering";
    case "SELECTED":
      return "selected";
    case "APPLIED":
      return "applied";
    case "ACCEPTED":
      return "accepted";
    case "NOT_PURSUING":
      return "not_pursuing";
    case "DECLINED":
      return "declined";
    case "NEW":
    default:
      return "new";
  }
}

export function cjProgramSortToUrlParam(sort: CJProgramSort) {
  switch (sort) {
    case "LAST_CHANGED_DESC":
      return "last_changed_desc";
    case "FEED_COUNT_DESC":
      return "feed_count_desc";
    case "NAME_ASC":
    default:
      return "name_asc";
  }
}

export function cjProgramsPath(pagination: Readonly<CJProgramsPagination>) {
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

export function cjProgramFilterPath(
  pagination: Readonly<CJProgramsPagination>,
  filters: Pick<CJProgramsPagination, "stage" | "sort">
) {
  return cjProgramsPath({
    ...pagination,
    ...filters,
    after: null
  });
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
  switch (value?.trim().toLowerCase()) {
    case "new":
      return "NEW";
    case "considering":
      return "CONSIDERING";
    case "selected":
      return "SELECTED";
    case "applied":
      return "APPLIED";
    case "accepted":
      return "ACCEPTED";
    case "not_pursuing":
      return "NOT_PURSUING";
    case "declined":
      return "DECLINED";
    default:
      return null;
  }
}

function normalizeSort(value: string | null): CJProgramSort {
  switch (value?.trim().toLowerCase()) {
    case "last_changed_desc":
      return "LAST_CHANGED_DESC";
    case "feed_count_desc":
      return "FEED_COUNT_DESC";
    case "name_asc":
    default:
      return "NAME_ASC";
  }
}

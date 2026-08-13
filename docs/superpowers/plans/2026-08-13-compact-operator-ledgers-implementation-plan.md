# Compact Operator Ledgers Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the revenue attribution and CJ program ledgers materially denser, preserve every existing fact and action, and keep all table content contained beside the operator sidebar.

**Architecture:** Revenue becomes a four-column native table with inline scan summaries and one structured conversion investigation disclosure. CJ becomes a four-column native table whose compact summary row opens a full-width editor row. Shared table containment remains generic, while operator tables remove their desktop minimum widths and comparison matrices retain intentional internal scrolling.

**Tech Stack:** React 19, Relay 21, Base UI Collapsible, TanStack Table 9, StyleX, Vitest, Testing Library, Playwright

## Global Constraints

- Preserve every revenue click, identity, diagnostic, commerce, conversion, CJ lifecycle, warning, edit, feedback, and feed fact or action listed in `docs/superpowers/specs/2026-08-13-compact-operator-ledgers-design.md`.
- Information may move into an accessible disclosure only when it remains available without navigation or a separate page.
- Keep native table semantics, keyboard operation, focus visibility, reduced-motion behavior, and independent loader, mutation, pagination, and error boundaries.
- Do not change GraphQL operations, generated Relay ownership, URL filters, pagination cursors, backend behavior, the workspace/context-rail breakpoint, or comparison-matrix behavior.
- Do not solve density by reducing typography, widening ordinary ledgers, hiding columns, converting ledgers to cards, or adding dependencies.
- Write each behavior test first, run it against the prior production implementation, and confirm the expected failure before changing source.

---

## File Responsibility Map

- `assets/src/routes/commerce/revenue/attribution/AttributionLedger.tsx` owns the four-column click ledger and compact scan hierarchy.
- `assets/src/routes/commerce/revenue/attribution/ConversionDetails.tsx` owns collapsed conversion facts and the structured investigation disclosure.
- `assets/src/routes/ingestion/cj-programs/programs/ProgramLifecycleTable.tsx` owns the four-column CJ table model and headers.
- `assets/src/routes/ingestion/cj-programs/programs/ProgramLifecycleRow.tsx` owns one program summary row, its full-width editor row, and row-local mutation state.
- `assets/src/ui/primitives/Table.tsx` owns generic table-container shrink and overflow containment, not route density decisions.
- `assets/test/routes/commerce/revenue/revenue-summary.route.test.tsx` proves revenue information preservation and disclosure semantics.
- `assets/test/routes/ingestion/cj-programs/cj-programs.route.test.tsx` proves compact CJ scanning, editor behavior, mutation locality, and feed preservation.
- `assets/tests/e2e/production-ui-operations.spec.ts` proves operator density, interactions, accessibility, and table containment at three widths.
- `assets/tests/e2e/production-ui-compare-return.spec.ts` proves deliberately wide comparison tables remain contained after the shared wrapper change.
- `docs/work/operator-workspaces.md` records the refinement and fresh verification evidence.

---

### Task 1: Compact the revenue ledger without losing investigation facts

**Files:**
- Modify: `assets/test/routes/commerce/revenue/revenue-summary.route.test.tsx`
- Modify: `assets/src/routes/commerce/revenue/attribution/AttributionLedger.tsx`
- Modify: `assets/src/routes/commerce/revenue/attribution/ConversionDetails.tsx`

**Interfaces:**
- Consumes: the existing `AttributionLedger_row` and `ConversionDetails_conversion` generated Relay fragments without changing their fields.
- Produces: four table columns named `Visit`, `Request`, `Commerce`, and `Conversion`; an accessible `Conversion <network reference> investigation` group; unchanged pagination and empty-state behavior.

- [ ] **Step 1: Write the failing four-column and non-loss route tests**

  Update the existing customer-facing ledger test to assert the new table model while retaining its current assertions for email, source, link type, referrer, user agent, IP address, network, amount, status, confidence, reference, and absence of internal IDs:

  ```tsx
  const ledger = screen.getByRole("table", { name: "Attribution ledger" });
  expect(within(ledger).getAllByRole("columnheader").map((header) => header.textContent)).toEqual([
    "Visit",
    "Request",
    "Commerce",
    "Conversion",
  ]);

  const visitRow = within(ledger).getByRole("row", { name: /operator@example\.test/ });
  expect(within(visitRow).getByText("May 31, 2026, 12:30 PM")).toHaveAttribute(
    "datetime",
    "2026-05-31T12:30:00Z",
  );
  expect(within(visitRow).getByText("Known customer")).toBeInTheDocument();
  expect(within(visitRow).getByText("SKU-42")).toBeInTheDocument();
  expect(within(visitRow).getByText("impact-program")).toBeInTheDocument();
  ```

  Replace the prose-oriented conversion assertions with a semantic investigation contract:

  ```tsx
  fireEvent.click(
    screen.getByRole("button", { name: "Show conversion impact-conversion-123 details" }),
  );

  const investigation = screen.getByRole("group", {
    name: "Conversion impact-conversion-123 investigation",
  });
  expect(within(investigation).getByText("Order value")).toBeInTheDocument();
  expect(within(investigation).getByText("Commission")).toBeInTheDocument();
  expect(within(investigation).getByText("90.00 USD")).toBeInTheDocument();
  expect(within(investigation).getByText("9.00 USD")).toBeInTheDocument();
  expect(within(investigation).getByText("Conversion Merchant")).toBeInTheDocument();
  expect(within(investigation).getByText("Conversion Product")).toBeInTheDocument();
  expect(within(investigation).getByText("Conversion Network")).toBeInTheDocument();
  expect(within(investigation).getByText("Purchased")).toBeInTheDocument();
  expect(within(investigation).getByText("Reported")).toBeInTheDocument();
  expect(investigation.querySelector("dl")).not.toBeInTheDocument();
  ```

- [ ] **Step 2: Run the revenue route test and verify RED**

  ```bash
  cd assets
  pnpm run test:unit -- test/routes/commerce/revenue/revenue-summary.route.test.tsx
  ```

  Expected: FAIL because the current headers are `Click`, `Identity`, `Request diagnostics`, `Commerce`, and `Matched conversions`, and there is no labeled investigation group or structured earnings/timeline labels.

- [ ] **Step 3: Merge click and identity into the `Visit` cell**

  Replace the five-column table definition with this four-column ownership:

  ```tsx
  const columns = columnHelper.columns([
    columnHelper.display({
      id: "visit",
      header: "Visit",
      cell: ({ row }) => <AttributionVisit click={row.original} />,
    }),
    columnHelper.display({
      id: "request",
      header: "Request",
      cell: ({ row }) => <AttributionDiagnostics click={row.original} />,
    }),
    columnHelper.display({
      id: "commerce",
      header: "Commerce",
      cell: ({ row }) => <AttributionCommerce click={row.original} />,
    }),
    columnHelper.display({
      id: "conversion",
      header: "Conversion",
      cell: ({ row }) => (
        <AttributionConversionList conversions={row.original.matchedConversions} />
      ),
    }),
  ]);
  ```

  Implement `AttributionVisit` as one compact hierarchy: exact click time first; source and link badges in one inline group; email/anonymous identity and its state in one inline identity group. Delete the now-independent `AttributionClickDetails` and `AttributionIdentity` owners.

- [ ] **Step 4: Tighten scan summaries without dropping metadata**

  Reduce route-local gaps and nested blocks to compact inline groups. Keep the full referrer and user agent in `title`, preserve the visible normalized copies, and keep IP, network, SKU, and affiliate program in visible text. Leave the existing `68rem` table minimum in place until Task 3 so the responsive containment test can prove its removal.

- [ ] **Step 5: Replace the conversion card with a structured disclosure**

  Keep the collapsed order amount, status, confidence, reference, and trigger visible. Remove the raised card background and padding. Render the open panel with a labeled group and three visual units:

  ```tsx
  <div
    aria-label={`Conversion ${conversion.networkConversionRef} investigation`}
    role="group"
    {...props(styles.investigation)}
  >
    <div {...props(styles.earnings)}>
      <div>
        <span {...props(styles.label)}>Order value</span>
        <strong>{formatCurrencyAmount(conversion.orderAmount, conversion.currency)}</strong>
      </div>
      <div>
        <span {...props(styles.label)}>Commission</span>
        <strong>{formatCurrencyAmount(conversion.commissionAmount, conversion.currency)}</strong>
      </div>
    </div>
    <div {...props(styles.commerceContext)}>
      <strong>{conversion.merchantName ?? "No merchant"}</strong>
      <span>{conversion.productName ?? "No product"}</span>
      <StatusBadge>{conversion.affiliateNetworkName ?? "No affiliate network"}</StatusBadge>
    </div>
    <ol aria-label="Conversion timeline" {...props(styles.timeline)}>
      <li {...props(styles.timelineItem)}>
        <span {...props(styles.label)}>Purchased</span>
        {conversion.purchasedAt ? (
          <time dateTime={conversion.purchasedAt}>
            {formatProductDateTimeLabel(conversion.purchasedAt)}
          </time>
        ) : (
          <span>Not recorded</span>
        )}
      </li>
      <li {...props(styles.timelineItem)}>
        <span {...props(styles.label)}>Reported</span>
        <time dateTime={conversion.reportedAt}>
          {formatProductDateTimeLabel(conversion.reportedAt)}
        </time>
      </li>
    </ol>
  </div>
  ```

  The purchased item must render `Not recorded` when `purchasedAt` is null. The reported item always renders the generated `reportedAt` value.

- [ ] **Step 6: Run focused revenue GREEN and commit**

  ```bash
  cd assets
  pnpm run relay:check
  pnpm run test:unit -- test/routes/commerce/revenue/revenue-summary.route.test.tsx test/routes/commerce/revenue/revenue-summary-view-data.test.ts
  git add src/routes/commerce/revenue/attribution test/routes/commerce/revenue
  git commit -m "feat: compact revenue attribution rows"
  ```

  Expected: PASS with all existing pagination, empty, anonymous, duplicate-reference, hydration, and independent-failure tests unchanged.

---

### Task 2: Move CJ editing into a full-width detail row

**Files:**
- Modify: `assets/test/routes/ingestion/cj-programs/cj-programs.route.test.tsx`
- Modify: `assets/src/routes/ingestion/cj-programs/programs/ProgramLifecycleTable.tsx`
- Modify: `assets/src/routes/ingestion/cj-programs/programs/ProgramLifecycleRow.tsx`

**Interfaces:**
- Consumes: the existing `ProgramLifecycleRow_program` fragment, update mutation, `ProgramFeeds`, lifecycle policy, and row-local refresh behavior.
- Produces: four headers named `Merchant`, `Lifecycle`, `Last change`, and `Action`; `Edit program <name>`/`Close editor <name>` buttons; a conditional `Edit <name>` region in a cell with `colSpan={4}`.

- [ ] **Step 1: Write the failing compact-row and editor tests**

  Change the lifecycle header assertion and prove the form is absent from the collapsed summary:

  ```tsx
  expect(within(ledger).getAllByRole("columnheader").map((header) => header.textContent)).toEqual([
    "Merchant",
    "Lifecycle",
    "Last change",
    "Action",
  ]);
  expect(screen.queryByLabelText("Stage for New Merchant")).not.toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: "Edit program New Merchant" }));
  const editor = screen.getByRole("region", { name: "Edit New Merchant" });
  expect(within(editor).getByLabelText("Stage for New Merchant")).toBeEnabled();
  expect(within(editor).getByLabelText("Note for New Merchant")).toBeEnabled();
  expect(within(editor).getByRole("button", { name: "Save New Merchant" })).toBeEnabled();
  expect(editor.closest("td")).toHaveAttribute("colspan", "4");
  ```

  Add helpers and use them before every existing test that accesses stage, note, save, feedback, or feeds:

  ```tsx
  function openProgramEditor(name: string) {
    fireEvent.click(screen.getByRole("button", { name: `Edit program ${name}` }));
    return within(screen.getByRole("region", { name: `Edit ${name}` }));
  }

  function programEditorFor(name: string) {
    return within(screen.getByRole("region", { name: `Edit ${name}` }));
  }
  ```

  Preserve every existing assertion for advertiser facts, warnings, exact time, future lifecycle values, note trimming, conflict refresh, row-local feedback, deferred feed loading, feed retry, and feed pagination. Add one close assertion proving the editor content is removed while the summary facts remain.

- [ ] **Step 2: Run the CJ route test and verify RED**

  ```bash
  cd assets
  pnpm run test:unit -- test/routes/ingestion/cj-programs/cj-programs.route.test.tsx
  ```

  Expected: FAIL because the current table has five headers, renders every edit form in the summary row, and has no program editor disclosure.

- [ ] **Step 3: Change the TanStack table to four columns**

  Replace `requiredAction` and `controls` with a single display column:

  ```tsx
  const columns = columnHelper.columns([
    columnHelper.display({ id: "merchant", header: "Merchant" }),
    columnHelper.display({ id: "lifecycle", header: "Lifecycle" }),
    columnHelper.display({ id: "lastChange", header: "Last change" }),
    columnHelper.display({ id: "action", header: "Action" }),
  ]);
  ```

  Leave the current `64rem` table minimum in place until Task 3.

- [ ] **Step 4: Split each program into summary and editor rows**

  Add `isEditing` and `useId()` to `ProgramLifecycleRow`. Return a fragment containing the summary row and conditional detail row. Keep advertiser/provider/feed count, lifecycle badge/warnings, exact last-change time, and required action visible in the summary. The Action cell contains only the required action and disclosure button:

  ```tsx
  <Button
    aria-controls={editorId}
    aria-expanded={isEditing}
    aria-label={`${isEditing ? "Close editor" : "Edit program"} ${programName}`}
    onClick={() => setIsEditing((open) => !open)}
    type="button"
    variant="secondary"
  >
    {isEditing ? "Close editor" : "Edit program"}
  </Button>
  ```

  Render the editor immediately after the summary:

  ```tsx
  {isEditing ? (
    <TableRow>
      <TableCell colSpan={4} style={styles.editorCell}>
        <div
          aria-label={`Edit ${programName}`}
          id={editorId}
          role="region"
          {...props(styles.editor)}
        >
          <div {...props(styles.controls)}>
            <Label style={styles.field}>
              <span {...props(styles.label)}>Stage for {programName}</span>
              <Select
                disabled={isUpdateInFlight || !stage}
                items={stageOptions}
                onValueChange={(nextStage) => {
                  setStage(
                    CJ_PROGRAM_STAGES.find(({ value }) => value === nextStage)?.value ?? null,
                  );
                }}
                value={stage ?? ""}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {stageOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Label>
            <Label style={styles.field}>
              <span {...props(styles.label)}>Note for {programName}</span>
              <Textarea
                disabled={isUpdateInFlight || !stage}
                onChange={(event) => setNote(event.currentTarget.value)}
                value={note}
              />
            </Label>
            <Button
              aria-label={`Save ${programName}`}
              disabled={isUpdateInFlight || !stage}
              onClick={handleSave}
              type="button"
            >
              {isUpdateInFlight ? "Saving..." : "Save"}
            </Button>
          </div>
          {feedback ? <p role="status">{feedback}</p> : null}
          <ProgramFeeds programId={program.id} programName={programName} />
        </div>
      </TableCell>
    </TableRow>
  ) : null}
  ```

  Use a route-local responsive grid for stage, note, and save controls. Do not mount `ProgramFeeds` outside the editor, and retain its current lazy query behavior so opening the editor alone does not fetch feeds.

- [ ] **Step 5: Preserve refreshed state and row-local mutation behavior**

  Keep the existing effect keyed by `lastChanged`, `note`, and `stage`. Keep `feedback` and both disclosure states local to the program component so revalidation does not close the editor or an expanded feed panel. Keep `aria-busy` on the summary row while saving and disable only that program's editor controls.

- [ ] **Step 6: Run focused CJ GREEN and commit**

  ```bash
  cd assets
  pnpm run relay:check
  pnpm run test:unit -- test/routes/ingestion/cj-programs/cj-programs.route.test.tsx test/routes/ingestion/cj-programs/cj-program-data.test.ts
  git add src/routes/ingestion/cj-programs/programs test/routes/ingestion/cj-programs
  git commit -m "feat: compact CJ program lifecycle rows"
  ```

  Expected: PASS with no changes to mutation variables, conflict handling, feed requests, unmatched-feed independence, or pagination URLs.

---

### Task 3: Contain tables and prove responsive density in a real browser

**Files:**
- Modify: `assets/tests/e2e/production-ui-operations.spec.ts`
- Modify: `assets/tests/e2e/production-ui-compare-return.spec.ts`
- Modify: `assets/src/ui/primitives/Table.tsx`
- Modify: `assets/src/routes/commerce/revenue/attribution/AttributionLedger.tsx`
- Modify: `assets/src/routes/ingestion/cj-programs/programs/ProgramLifecycleTable.tsx`

**Interfaces:**
- Consumes: `[data-slot="table-container"]` from the shared `Table` primitive and the existing desktop/tablet/mobile viewport matrix.
- Produces: ordinary operator ledgers with no internal horizontal scroll at 1,440px and 900px; contained internal scrolling at 390px when needed; comparison tables whose containers remain bounded while their intentional matrix scrolling survives.

- [ ] **Step 1: Add failing operator table measurements and preserved-detail interactions**

  Add this helper to the operations spec:

  ```ts
  // Add Locator to the existing @playwright/test type imports.
  async function expectTableContained(table: Locator, options: { compact: boolean }) {
    const bounds = await table.evaluate((element) => {
      const container = element.closest<HTMLElement>('[data-slot="table-container"]');
      const parent = container?.parentElement;

      if (!container || !parent) throw new Error("Expected a table container and parent.");

      return {
        clientWidth: container.clientWidth,
        containerRight: container.getBoundingClientRect().right,
        parentRight: parent.getBoundingClientRect().right,
        scrollWidth: container.scrollWidth,
      };
    });

    expect(bounds.containerRight).toBeLessThanOrEqual(bounds.parentRight + 1);
    if (options.compact) {
      expect(bounds.scrollWidth).toBeLessThanOrEqual(bounds.clientWidth + 1);
    }
  }
  ```

  Call it for the CJ and revenue tables with `compact: viewport.name !== "mobile"`. In the same scenario:

  - Open `Edit program Northwind Merchant`, assert advertiser ID, feed count, stage, note, save, and feed disclosure remain available, then close it.
  - Open the conversion investigation and assert order value, commission, merchant, product, network, purchased time, and reported time before closing it.
  - Keep the existing axe, reduced-motion, document-width, and screenshot checks.

- [ ] **Step 2: Extend the comparison browser audit**

  In the comparison viewport loop, measure every `[data-slot="table-container"]` and assert its right edge is at most its parent right edge plus one pixel. Do not assert `scrollWidth <= clientWidth`; specification and decision matrices deliberately retain internal horizontal scrolling.

- [ ] **Step 3: Run the operator browser scenario and verify RED**

  ```bash
  cd assets
  PLAYWRIGHT_PORT=4187 pnpm exec playwright test tests/e2e/production-ui-operations.spec.ts --reporter=line
  ```

  Expected: FAIL at desktop CJ and tablet revenue/CJ compact-width assertions because the route tables still impose `64rem` and `68rem` minimum widths.

- [ ] **Step 4: Make the shared table wrapper shrink inside layout rails**

  Change only the generic wrapper containment contract:

  ```tsx
  wrapper: {
    maxWidth: "100%",
    minWidth: 0,
    overflowX: "auto",
    position: "relative",
    width: "100%",
  },
  ```

  Do not change cell padding globally and do not remove overflow scrolling from the primitive.

- [ ] **Step 5: Remove desktop minimum widths from operator tables**

  Give both operator tables `tableLayout: "fixed"` and `width: "100%"`. Use a route-local minimum only below the context-rail breakpoint so mobile keeps readable columns inside the shared scroll container:

  ```tsx
  table: {
    minWidth: {
      default: "44rem",
      "@media (min-width: 62rem)": 0,
    },
    tableLayout: "fixed",
    width: "100%",
  },
  ```

  For the revenue route, also clear the minimum at tablet width because it has no context rail:

  ```tsx
  table: {
    minWidth: {
      default: "44rem",
      "@media (min-width: 48rem)": 0,
    },
    tableLayout: "fixed",
    width: "100%",
  },
  ```

  Keep overflow wrapping on long email, URL, user-agent, SKU, program, and conversion reference values.

- [ ] **Step 6: Run operator and comparison browser GREEN and inspect captures**

  ```bash
  cd assets
  PLAYWRIGHT_PORT=4187 pnpm exec playwright test tests/e2e/production-ui-operations.spec.ts tests/e2e/production-ui-compare-return.spec.ts --reporter=line
  ```

  Expected: PASS at all three viewports. Inspect the generated desktop/tablet CJ and revenue screenshots to confirm no content is hidden beneath the context rail, rows are visibly shorter, conversion details are grouped rather than prose, and comparison matrices still scroll internally at narrow widths.

- [ ] **Step 7: Commit responsive containment**

  ```bash
  git add src/ui/primitives/Table.tsx src/routes/commerce/revenue/attribution/AttributionLedger.tsx src/routes/ingestion/cj-programs/programs/ProgramLifecycleTable.tsx tests/e2e/production-ui-operations.spec.ts tests/e2e/production-ui-compare-return.spec.ts
  git commit -m "fix: contain compact tables beside context rails"
  ```

---

### Task 4: Audit all table consumers and close the refinement

**Files:**
- Inspect: `assets/src/routes/compare/live/SpecificationMatrix.tsx`
- Inspect: `assets/src/routes/compare/live/DecisionSummary.tsx`
- Inspect: every path returned by `rg -l '<Table' assets/src -g '*.tsx'`
- Modify: `docs/work/operator-workspaces.md`

**Interfaces:**
- Produces: a complete shared-table consumer inventory, preserved intentional comparison scrolling, updated operator lane evidence, and a clean verified branch.

- [ ] **Step 1: Audit the complete shared-table inventory**

  ```bash
  rg -l '<Table' assets/src -g '*.tsx' | sort
  rg -n 'minWidth|overflowX|overflow: "hidden"|tableLayout' assets/src/routes/compare assets/src/routes/commerce/revenue assets/src/routes/ingestion/cj-programs assets/src/ui/primitives/Table.tsx -g '*.tsx'
  ```

  Expected inventory: revenue attribution, CJ lifecycle, specification matrix, and decision summary. Confirm only the comparison matrices retain `48rem` minimum widths and that their horizontal overflow is contained inside `[data-slot="table-container"]`.

- [ ] **Step 2: Update lane evidence**

  Add a compact-ledger refinement section to `docs/work/operator-workspaces.md` recording:

  - Four revenue columns and the full non-loss fact inventory.
  - Structured earnings/context/timeline conversion disclosure.
  - Four CJ columns and the full-width editor row with unchanged mutation/feed behavior.
  - Desktop/tablet no-scroll operator proof, mobile contained-scroll proof, comparison containment proof, accessibility results, and inspected screenshots.

- [ ] **Step 3: Run the complete frontend and repository gates**

  ```bash
  cd assets
  pnpm run check
  PLAYWRIGHT_PORT=4187 pnpm exec playwright test tests/e2e/production-ui-operations.spec.ts tests/e2e/production-ui-compare-return.spec.ts --reporter=line
  cd ..
  mix work_queue.validate
  git diff --check
  git status --short
  ```

  Expected: Relay validation, TypeScript, lint, formatting, all unit tests, both builds, StyleX mangling, bundle budget, operator/comparison browser scenarios, queue validation, and whitespace checks pass. The status output contains only the intended lane-doc change before commit.

- [ ] **Step 4: Commit the verified closeout**

  ```bash
  git add docs/work/operator-workspaces.md
  git commit -m "docs: verify compact operator ledgers"
  git status --short --branch
  ```

  Expected: clean `codex/operator-workspaces` worktree with the compact-ledger commits ahead of its prior closeout.

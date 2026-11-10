# From UI learning to Imaging Engine regression

The starter smoke verifies access/navigation only.
The ideas below are **candidate regressions**, not implemented coverage.
Confirm each capability in your deployment: My Workspace may not expose every
Pilot/engine operation or configuration.

## Start with a manual test you already trust

Choose one approved, repeatable regression. Define its environment, ticket,
sample input, expected output, tolerances and cleanup with an Imaging Engine owner.
Do not use arbitrary existing production jobs as your oracle.

| Candidate | Learn | Required verification |
| --- | --- | --- |
| Read known job details | Navigation, tables, scoped locators | Approved stable job and expected fields |
| Find a uniquely named workflow in Activity | Search/waiting, exact row correlation | Real search behavior and data ownership |
| Launch an approved workflow | Upload/actions, run identity | Actual exposed capability, input/ticket approval |
| Observe terminal success/failure | Bounded polling, error diagnosis | Actual state vocabulary and time budget |
| Download approved output | Download event and file assertions | Real download control and expected artifacts |
| Compare controlled input/settings variants | Data-driven tests | Stable engine setup and external output oracle |
| Invalid input behavior | Negative tests | Isolated environment and agreed failure behavior |

Keep read-only investigation first. Upload/launch/cancel/delete and engine changes
are mutating operations even if the browser interaction looks harmless.

## A useful layered regression

1. **Environment:** approved build/configuration, available engine/license, known
   workflow ticket, dedicated QA permissions.
2. **Input:** legally owned small sample with a known hash and agreed properties.
3. **Submission:** launch once; capture a unique run ID, not just a display name.
4. **Progress:** correlate to that run; poll real observable state until an agreed
   terminal state or explicit deadline.
5. **UI result:** assert expected status and meaningful task/error information.
6. **Output result:** inspect the actual downloaded/accessible artifacts.
7. **Cleanup:** remove only this run's permitted test-owned data; report cleanup
   failure separately from the primary result.

No retries of whole launch tests until launch idempotency is proven.
If a submission times out ambiguously, investigate by correlation before retrying;
otherwise the engine may process the same input twice.

## Polling: concept, not an invented API

Playwright's `expect.poll` can wait for an actual discovered task-state reader:

```typescript
// Design only: implement readStateForRun with the real observed UI/API contract.
await expect.poll(async () => {
  const state = await readStateForRun(runId);
  if (isTerminalFailure(state)) {
    throw new Error("The approved workflow failed; inspect private task evidence.");
  }
  return state;
}, { timeout: agreedEngineBudgetMs, intervals: [1000, 2000, 5000] })
  .toBe(expectedSuccessfulState);
```

Use real terminal states, no guessed strings. Budgets reflect measured test-case
duration, not a universal five-second wait. Browser navigation readiness and engine
completion are different conditions.

## What should output assertions prove?

- Output exists, is nonempty and has the expected type/count/naming contract.
- Dimensions, resolution, page count, color spaces and separations match the
  approved expectation where relevant.
- Metadata/settings of the engine run match what the regression is intended to test.
- Use approved image/PDF analysis/comparison tools for actual raster/content checks.
- Define tolerances with product experts: anti-aliasing, rendering differences,
  timestamps, metadata and compression can make binary hashes unsuitable.

Browser screenshot diffs only show the web UI. They do **not** certify Imaging
Engine rendering, color fidelity or print correctness.
Playwright can orchestrate actions/downloads; external domain tools provide
the correct artifact oracle. Add those dependencies only when a real case needs them.

## Safe data and mutation policy

- Separate test environment and dedicated accounts; no production regression.
- Unique run identifiers and isolated input/output folders.
- One worker initially; coordinate across local/CI processes using the same account.
- Fixture-owned cleanup that remains possible if the page fails.
- Retain minimal approved evidence; never ship customer files in this starter.
- Add a separate opt-in config/runner excluding `@Mutating` from defaults before
  implementing a launch scenario. A tag by itself does not exclude a test.

Use [the design worksheet](../examples/imaging-engine/REGRESSION_DESIGN.md) to
turn one approved manual regression into a reviewed automated test.

# A QA colleague's Playwright learning journey

Use short sessions with one observable outcome. Native Playwright first helps you
understand actions/assertions; BDD then adds a readable specification layer.
You do not need to learn every browser/tool/CI feature at once.

## Milestone 1: a working local foundation

**Learn:** Node/npm, dependencies, browser installation, test discovery.

Follow [Local Setup](LOCAL_SETUP.md) and [VS Code Setup](VSCODE_SETUP.md).
Read the native smoke aloud: open workspace, open Activity, verify readiness.

**Exercise:** run `npm run quality`, then list each suite separately.
**Done when:** you can explain why generation/listing needs no credentials but
live execution does.

## Milestone 2: authentication and one native smoke

**Learn:** browser contexts, private state, manual capture, expired sessions.

Capture your own QA login and run `npm run test:headed`.

**Exercise:** temporarily choose a nonexistent state path in your private `.env`.
Run `npm run setup:check`; observe the explicit failure; restore the path.
Do not delete a colleague's session or sign out a shared account.

**Done when:** you can distinguish valid JSON from valid authentication and explain
why merely seeing the product logo is a weak login assertion.

## Milestone 3: locators and assertions

**Learn:** roles, accessible names, exactness, scoping, auto-waiting.

```typescript
await page.getByRole("navigation")
  .getByRole("link", { name: "Activity", exact: true })
  .click();
await expect(page.getByRole("heading", {
  name: "Activity", level: 1, exact: true
})).toBeVisible();
```

**Exercise:** inspect Activity's search control and explain why a `searchbox`
role is preferable to an unstable CSS class. Then identify another **read-only**
screen and verify its heading manually before writing a test.

**Done when:** your locator identifies exactly one visible intended control and
your assertion describes behavior, not implementation.

Avoid `waitForTimeout`, `nth(0)` to hide ambiguity, forced clicks, or assertions
that only check that `page` exists.

## Milestone 4: debugging instead of timeout inflation

**Learn:** Inspector, breakpoints, UI mode, reports, optional traces.

Run `npm run test:debug`. Stop inside the helper; inspect the locator.
Try the locator picker. Read an HTML report.

**Exercise:** in a local learning branch/copy, intentionally change the expected
Activity heading to a nonexistent name. Observe the failure and restore it.
Enable private failure evidence only if appropriate.

**Done when:** you can locate the failing action/assertion and distinguish an
expired login, wrong locator, loading issue and genuine application defect.

## Milestone 5: translate the same behavior into BDD

**Learn:** Given precondition, When action, Then outcome; thin steps; generation.

Compare the native smoke with `features/current/workspace/activity.feature`.
Follow each step into `tests/steps/workspace.steps.ts`.

**Exercise:** add another verified read-only scenario, reusing the existing Given.
Generate with `npm run bdd:gen`, list, then run only the new case.

```sh
npm run test:bdd -- --grep "Your verified scenario title"
```

**Done when:** a QA colleague can understand the feature without reading selectors.
No generated files are edited.

`And` inherits the preceding keyword: after `Then`, bind it as `Then`.
Do not write click-by-click Gherkin or duplicate generic step expressions.

## Milestone 6: parameters and stable data

**Learn:** Scenario Outlines, fixtures, deterministic expected results.

Use outline examples only for verified behavior and approved data:

```gherkin
# Design exercise, not executable until implemented against your real UI.
Scenario Outline: An approved workflow produces the expected result
  Given an approved input for "<case>"
  When its approved Imaging Engine workflow finishes
  Then its output meets the agreed "<expectation>"
```

**Exercise:** build a worksheet with two owned sample inputs and their expected
outcomes before coding. Avoid coupling expectations to existing arbitrary jobs.

**Done when:** the cases are reproducible, independently attributable, and safe
to run without affecting other users.

## Milestone 7: the first Imaging Engine slice

**Learn:** workflow correlation, asynchronous state, product/output oracle.

Read [Imaging Engine Regression](IMAGING_ENGINE_REGRESSION.md).
Start with a known approved job's read-only details/status if available.
Only add launch automation when permissions, data and cleanup are agreed.

**Exercise:** map one manual regression to:
preconditions -> action -> observable UI status -> actual output checks -> cleanup.

**Done when:** a reviewer can explain what the test proves and what it does not.
A green workflow status alone is not proof that separations or rendered output
are correct.

## Milestone 8: optional automation of the test execution

**Learn:** Git basics, PR quality checks, Variables/Secrets, runner reachability.

First run credential-free GitHub checks. Only later connect a protected live
workflow to a trusted runner. Use the local CLI before scheduling anything.

**Done when:** no secrets/state are committed, private environments are not
available to untrusted PR code, and failures produce actionable exit codes.

## Review habits to keep

- Before each new test: identify its risk, expected result and owned data.
- Automate a small valuable assertion; resist broad generic step frameworks.
- Assert a measurable condition, not merely a successful click.
- Run the smallest relevant test while developing; run quality before handoff.
- A skipped/placeholder test is not regression coverage.
- Classify failures; do not retry away evidence or report infrastructure failure
  as an application pass.

References: [Playwright best practices](https://playwright.dev/docs/best-practices),
[fixtures](https://playwright.dev/docs/test-fixtures),
[debugging](https://playwright.dev/docs/debug),
[BDD](https://vitalets.github.io/playwright-bdd/).

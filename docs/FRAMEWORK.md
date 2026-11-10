# Small framework, explicit behavior

This starter adapts the source IoT project's thin-step, shared-helper and fixture
principles. It deliberately excludes IoT domains, complex SSO recovery, Jira,
enterprise reporting and scheduling machinery.

## Native flow

```text
npm run test:native
  -> playwright.config.ts
  -> tests/native/*.spec.ts
  -> shared fixture: URL + validated private storage-state path
  -> fresh browser context/page
  -> My Workspace helper
  -> real UI assertions and local reports
```

## BDD flow

```text
npm run test:bdd
  -> bddgen with playwright.bdd.config.ts
  -> features/current/**/*.feature + tests/steps/**/*.ts
  -> .features-gen (ignored, do not edit)
  -> Playwright Test using the same fixture and helper
```

`playwright-bdd` is an adapter, not the Cucumber runtime.
Use `createBdd(test)` and the extended test from `tests/fixtures.ts`.
No Cucumber World classes or second test runner are required.

## File responsibilities

| Location | Responsibility |
| --- | --- |
| `playwright.config.ts` | Native test discovery |
| `playwright.bdd.config.ts` | BDD source mapping/generated discovery |
| `playwright.shared.ts` | Serial execution, timeouts, evidence/report defaults |
| `tests/fixtures.ts` | Scenario/test configuration and storage-state injection |
| `tests/support/config.ts` | Environment validation and state-file shape |
| `tests/support/myworkspace.ts` | Small shared UI actions and assertions |
| `tests/native` | Native readable test examples |
| `tests/steps` | Gherkin bindings, no duplicate step text |
| `features/current` | Implemented behavioral scenarios only |
| `support-tests` | Credential-free support unit tests |
| `examples/imaging-engine` | Non-executable learning/design material |
| `scripts` | Local capture/setup utilities |

## Why these defaults?

- One worker and no full parallelism: safe starting point for shared live accounts.
- No retries: a beginner should see instability, and later job launch must not
  accidentally repeat when a whole test retries.
- No baseURL validation during config loading: credential-free discovery works.
  Target validation happens when the live fixture is requested.
- Failure evidence opt-in: live enterprise data may be sensitive.
- Separate native/BDD outputs: reports do not overwrite each other.
- Authentication is captured outside tests; tests never silently log in.
- No World object yet: the smoke needs no cross-step custom data.

Playwright requires fixture callbacks to destructure their first argument, even
when they need no dependency. The ESLint empty-pattern exception is scoped only
to the fixture file for this reason.

## Locator strategy

1. Prefer `getByRole`, `getByLabel`, and a verified accessible name.
2. Scope to the relevant navigation/panel/dialog.
3. Use agreed `getByTestId` hooks where semantics are insufficient.
4. Use narrow CSS only when verified and documented.

No arbitrary sleeps, positional selectors, broad substring matches, ignored
exceptions, or "if found, assert; otherwise pass".
Web-first assertions wait for observable conditions.

The baseline uses observed English `Activity` and `Search` semantics.
Do not translate names by guesswork; inspect your deployed UI.

## Adding a domain

Add one feature file, thin steps and a small owning helper. Keep shared logic
plain until real repetition/complexity justifies a page object.
If later a workflow ID must travel across steps, add typed scenario-scoped state
through the fixture. Do not put mutable IDs in global variables.

Use tags `@MyWorkspace`, `@Smoke`/`@Regression`, and `@Domain<Area>`.
Reserve `@ImagingEngine` and `@Mutating` for verified later coverage.
Before introducing mutation tests, add explicit default exclusion and an opt-in
runner/config; tags alone do **not** prevent execution.

Run `npm run quality`, then the smallest relevant live suite.

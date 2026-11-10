# Automation Engine My Workspace: QA learning starter

A standalone, **local-first** foundation for learning Playwright Test and
`playwright-bdd`, then applying those skills to Imaging Engine regression testing
through the real Automation Engine My Workspace web app.

There is **no demo app**, embedded installation URL, credential, saved session, or
customer test data. You supply an approved AE test environment and your own QA
account. No changes to the source IoT project are required.

## What works out of the box?

After installing prerequisites:

- Lint, TypeScript checks, support unit tests, BDD generation and test discovery
  run **without credentials or an AE connection**.
- One native Playwright test and one equivalent BDD scenario are ready to run
  once you configure your URL and private credentials for the verified local login form.
- The smoke tests only open My Workspace and navigate to **Activity**, checking
  its heading and search control. They do not launch workflows or change data.
- VS Code recommendations/tasks and optional GitHub workflows are included.

The selectors were grounded in read-only discovery of an English My Workspace
installation. Other versions, languages or permissions may need the small shared
helper adapted. The smoke proves UI access, **not Imaging Engine output quality**.
See [validation notes](docs/VALIDATION.md) for what was actually verified.

## First local run

Use a current **Node.js 22 LTS, at least 22.13**, npm and VS Code.
Node 20.19+ is compatible with this package, but 22 is the recommended learning baseline.
Double-click [AE-MyWorkspace.code-workspace](AE-MyWorkspace.code-workspace), or
use VS Code **File > Open Workspace from File**. It opens only this starter folder,
uses its settings/tasks, and selects the README as the startup editor.

```sh
npm ci
npm run setup:browsers
npm run quality
```

Copy `.env.example` to `.env`:

```sh
# macOS/Linux
cp .env.example .env
```

```powershell
# Windows PowerShell
Copy-Item .env.example .env
```

Replace the placeholder `BASE_URL` in `.env` with your approved My Workspace URL,
and set `LOGIN_USER` and `LOGIN_PASSWORD` privately for the verified English local
login form. Do not put credentials in test code. External SSO/MFA needs a separately
approved authentication strategy. Connect to any required VPN first.

```sh
npm run test:smoke
npm run test:bdd
```

Both smoke tests sign in afresh in headed Chromium. `auth:capture` remains available
for manually saving a session when exploring or building a flow that uses saved state.

Need help? Start with [local setup](docs/LOCAL_SETUP.md),
[VS Code setup](docs/VSCODE_SETUP.md), and [authentication](docs/AUTHENTICATION.md).

## Your learning route

1. Follow [Learning Path](docs/LEARNING_PATH.md): native test first, BDD second.
2. Use [My Workspace discovery](docs/MYWORKSPACE_DISCOVERY.md) to verify your UI.
3. Review [framework design](docs/FRAMEWORK.md) before adding shared logic.
4. Choose one safe manual regression from
   [Imaging Engine regression ideas](docs/IMAGING_ENGINE_REGRESSION.md).
5. Only later: [GitHub Actions](docs/GITHUB_ACTIONS.md) and
   [local/self-hosted runners](docs/LOCAL_RUNNERS.md).

## Command reference

| Command | Purpose |
| --- | --- |
| `npm run quality` | Credential-free lint, types, support tests and discovery |
| `npm run test:support` | Unit tests of configuration/auth-state handling |
| `npm run test:list` | List native and BDD tests, generating BDD first |
| `npm run auth:capture` | Headed manual login, verify and save private Chromium state |
| `npm run auth:login` | Explicit optional local-form login from private credential variables |
| `npm run setup:check` | Validate your URL and saved-state file shape |
| `npm test` / `npm run test:smoke` | Run the native read-only smoke |
| `npm run test:bdd` | Generate and run the equivalent BDD scenario |
| `npm run test:job-context` | Run the separate opt-in Job Context BDD feature, including workflow forwarding |
| `npm run test:headed` | Watch the native test |
| `npm run test:debug` | Native test with Inspector |
| `npm run test:ui` / `npm run test:bdd:ui` | Native / BDD UI mode |
| `npm run report:native` / `npm run report:bdd` | Open existing HTML reports |

Use `npm run test:bdd -- --headed` to watch BDD, or
`npm run test:bdd -- --grep @Smoke` to filter it.

Native and BDD examples intentionally cover the **same behavior** for comparison.
Run either style for routine regression; running both is not double business coverage.

## Workflow regression

The short workflow command loads ignored `.env.workflow` after `.env`; its
settings override the general login only for that command. Keep workflow
credentials and `WORKFLOW_INPUT_DIR` there when using a separate test account.

The opt-in [workflow test](tests/native/workspace.workflow.spec.ts) launches the
predefined `smoke test my workspace` workflow and completes its matching To-Do.
It starts with an empty browser session, signs in using private `LOGIN_USER` and
`LOGIN_PASSWORD` environment variables, and signs out in teardown even on failure.
Before signing out, workflow teardown removes pending `smoke test my workspace`
To-Dos owned by `WORKFLOW_USER` (default `lap`) using **Aborted**, as approved for
cleanup. This rejects the checkpoint rather than permanently deleting it. Other
users and workflow subjects are left untouched. Logout is attempted even if
cleanup fails. The authentication-only check does not clean up To-Dos.
It does not reuse saved authentication. The default expected user is `lap`;
set `WORKFLOW_USER` to use different initials.

Set credentials privately in your local environment or ignored `.env` file.
Set `WORKFLOW_INPUT_DIR` to a local directory containing `launchfile_1.pdf` and
`launchfile_2.pdf`. For the default smoke-test account, set `LOGIN_USER=lap` and
use that account's password, not a different email-based account's credentials.
Then run the headed, slow-motion workflow test with:

```powershell
npm run test:workflow
```

To check fresh login and logout without launching a workflow, use the same
opt-in and credentials with:

```powershell
$env:RUN_WORKFLOW_TEST = 'true'
npx playwright test -c playwright.config.ts tests/native/workspace.workflow.spec.ts --grep 'Fresh workflow login signs out'
Remove-Item Env:RUN_WORKFLOW_TEST
```

## Job Context Feature

The separate [Job Context feature](features/current/workspace/job-context.feature)
has its own [step definitions](tests/steps/job-context.steps.ts) and runner. It does
not change the native workflow regression. Both scenarios sign in freshly and
sign out in teardown, including failures, using private `LOGIN_USER` and
`LOGIN_PASSWORD` from `.env` or the overriding ignored `.env.workflow`.

```powershell
npm run test:job-context
# Context, product filtering and narrow-screen previews without launching a workflow:
npm run test:job-context -- --grep-invert '@Mutating'
```

Defaults match the inspected fixture: `JOB_CONTEXT_NAME=Job_lap`, with
`Smoke Test for BrowserMyWorkspace/input files/launchfile_1.pdf` inside that job.
`JOB_CONTEXT_FILE` can override the file name. `JOB_CONTEXT_PRODUCTS` is the
pipe-separated expected product list, defaulting to
`jobfile|multipart product_lap`; `JOB_CONTEXT_MULTIPART_PRODUCT` defaults to
`multipart product_lap`. Set these only in private local configuration.

The read-only scenario verifies automatic Files navigation, the blue banner
(absent on Jobs), job-only folders/products, restored unfiltered products and
Files containers, and both multipart preview arrows at a 320-pixel viewport.
Desktop and narrow preview screenshots are attached to its local BDD report.
The inspected job has two assigned products, not one.

The mutating scenario launches `smoke test my workspace`, identifies the new
user-owned To-Do and opens its Forward icon. It opens the list icon beside the
To field, scrolls to and selects `lap_admin` in the Select user dialog, confirms
both dialogs, and verifies the persisted owner is `lap_admin`. It does not search
for `admin`. Both `lap` and `lap_admin` display the full name Lakshana, so ownership
is verified by username, not by a change in the recipient's display text.
Teardown aborts only that scenario's identified To-Do, then signs out. Existing
To-Dos are not cleaned up by this feature. If creation succeeds but identification
fails, review the new workflow manually; unrelated tasks are never guessed at.

Live validation: context/restoration, 320-pixel multipart navigation, and forwarding
from `lap` to `lap_admin` through the user picker passed in headed mode.

## Safety defaults

- Chromium only; one worker; no automatic retries. The mutating workflow test
  requires explicit opt-in and is skipped by default.
- Missing setup fails explicitly, never silently skips or logs in as an admin.
- Manual login is recommended first. Optional `auth:login` supports the verified
  local AE form; merely setting `LOGIN_USER`/`LOGIN_PASSWORD` does **not** enable it
  during capture or test runs. External SSO/MFA requires its own approved strategy.
- Failure screenshots/traces are opt-in via `PW_CAPTURE_EVIDENCE=true`.
  Reports/logs can still contain private data even with screenshots disabled.
- `.env`, `.auth`, generated tests, evidence and downloaded output are Git-ignored.
- Never commit or upload saved auth, credentials, customer inputs, or raw traces
  without approved handling.

## Official references

- [Playwright introduction](https://playwright.dev/docs/intro)
- [Locators](https://playwright.dev/docs/locators) and
  [web-first assertions](https://playwright.dev/docs/test-assertions)
- [Authentication](https://playwright.dev/docs/auth)
- [Playwright-BDD documentation](https://vitalets.github.io/playwright-bdd/)
- [GitHub Actions documentation](https://docs.github.com/en/actions)

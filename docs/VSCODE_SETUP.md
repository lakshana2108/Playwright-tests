# VS Code setup and daily workflow

## Open the right workspace

Double-click [AE-MyWorkspace.code-workspace](../AE-MyWorkspace.code-workspace), or
use **File > Open Workspace from File**. The relative `.` folder path makes the
workspace portable: moving the whole package does not require changing it.
It opens only the starter root, applies the folder settings/tasks, and uses the
README as the startup editor.

Alternatively, use **File > Open Folder** and select the standalone starter root
containing `package.json` and `.vscode`. Do not open its parent Desktop or the
original IoT repository. Trust the workspace only after reviewing it.

Use **Terminal > New Terminal**; check `node --version` and `npm --version`.
Follow [local setup](LOCAL_SETUP.md). Use **TypeScript: Select TypeScript Version**
from the Command Palette and select the workspace version after `npm ci`.

## Recommended extensions

The Extensions view offers the recommendations in `.vscode/extensions.json`.

| Extension | Why |
| --- | --- |
| [Playwright Test for VS Code](https://marketplace.visualstudio.com/items?itemName=ms-playwright.playwright) | Test Explorer, browser watching, locators and debugging |
| [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) | Show and fix lint findings in TypeScript |
| [Cucumber](https://marketplace.visualstudio.com/items?itemName=CucumberOpen.cucumber-official) | Gherkin highlighting, completion, step navigation |

JavaScript/TypeScript support, Git, terminal and Markdown preview are built in.
No additional Cucumber execution extension or `@cucumber/cucumber` runner is needed:
**Playwright Test runs this project**.

The Cucumber extension is an editor aid, not the authoritative matcher for
`playwright-bdd`. `npm run bdd:gen` is the authority for missing/ambiguous steps.
If the extension does not recognize a step, check its configured `cucumber.glue`
paths and framework support before rewriting working code.

No competing formatter is recommended. ESLint fixes are configured on explicit
save; manually choose the Cucumber formatter for Gherkin if desired.

## Ready-to-use tasks

Use **Terminal > Run Task**:

| Task | Use |
| --- | --- |
| Starter: npm ci | Initial reproducible install |
| Starter: install Chromium | Browser installation |
| Starter: quality | Lint, types, unit tests, generation and listing |
| Starter: generate BDD | After changing a feature or step |
| Starter: list tests | Check both independent configurations |
| Starter: capture login | Capture your personal authenticated state |
| Starter: explicit credential login | Optional local-form login from private env variables |
| Starter: check local setup | Check settings/state file shape |
| Starter: native smoke / BDD smoke | Run the learning examples |
| Starter: native UI / BDD UI | Interactive runs using the right config |
| Starter: native report / BDD report | Open existing report |

The quality task is also the default build task (`Ctrl+Shift+B` / `Cmd+Shift+B`).
Task failures preserve a nonzero exit status. Login values are not task arguments.
All npm tasks resolve from this workspace's package, not the IoT project.

## Native tests in Test Explorer

1. Open the Testing view after installation.
2. In the Playwright extension's configuration selector, choose
   `playwright.config.ts`, and enable its `chromium` project.
3. Expand the native smoke test and run it using its play button.
4. Enable **Show browser** when learning; use the debug button to stop at a
   breakpoint inside `tests/native/workspace.smoke.spec.ts`.
5. Breakpoints in the shared TypeScript helper show how actions and assertions
   work. Do not inspect or share secrets in debugger variable panes.

The fixture reads `.env` and state at execution time. Test Explorer does not
capture login for you: run the capture task first.

## BDD discovery and debugging

1. Run **Starter: generate BDD** or `npm run bdd:gen`.
2. Select `playwright.bdd.config.ts` in the extension's config selector.
3. Refresh tests when necessary; select only that config/project while learning.
4. Run the generated scenario. Put breakpoints in
   `tests/steps/workspace.steps.ts` and `tests/support/myworkspace.ts`.
5. Edit the feature/steps, **never** `.features-gen` output; regenerate afterward.

The generated folder is hidden from the file explorer/search to avoid accidental
edits. It still exists on disk and is the BDD config's test directory.

Generation is not guaranteed before every Test Explorer action. The extension
does not automatically honor an arbitrary task as a prelaunch hook.
The **BDD smoke/UI tasks** are the reliable generation-aware alternative.

If both configs are selected, the equivalent examples may both appear.
That is intentional learning duplication, not duplicate business coverage.
The native config scans only `tests/native`; BDD scans only `.features-gen`.

## Useful debugging sequence

```sh
npm run test:debug
npm run test:bdd -- --debug
npm run test:bdd:ui
```

Read the failing locator/assertion before increasing timeouts. Use Playwright's
locator picker or Inspector to verify the accessible role and name.
Use codegen as a sketch, then replace fragile generated selectors and add
meaningful business assertions. Do not copy recorded login values into tests.

For codegen with private saved state, from your terminal:

```sh
npx playwright codegen --load-storage=.auth/myworkspace-chromium.json "https://your-ae-host.example/myworkspace/"
```

Replace the example URL privately. Do not use `--load-storage` for another
environment/account; do not commit recorded scripts containing private data.

## If the extension does not discover tests

- Confirm workspace root and extension enabled/trusted.
- Run `npm run test:list`; a CLI failure is not an editor problem.
- Generate BDD; verify selected config and enabled Chromium project.
- Refresh the Testing view or reload the VS Code window.
- Verify local Node meets the required version and reinstall with `npm ci`.
- Use the configured npm tasks while diagnosing extension-specific issues.

The provided settings/task JSON and CLI commands are validated independently.
Installing extensions and their GUI behavior on a colleague's VS Code remains a
machine-specific onboarding check, not something a CLI typecheck can prove.

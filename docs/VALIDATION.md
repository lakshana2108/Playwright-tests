# Validation and honest coverage

The package is independent of the original IoT project.
No target URL, real credential, saved session or private application data is
provided in the starter. Installation-specific access is required for live tests.

## Checks performed locally

| Command/check | Result |
| --- | --- |
| `npm install` | Passed; independent lockfile generated, audit reported zero vulnerabilities |
| `npm ci` | Passed; lockfile reproduced, audit reported zero vulnerabilities |
| `npm run quality` | Passed: lint, TypeScript, support tests, BDD generation and separate discovery |
| `npm run setup:browsers` | Passed; matching Chromium installed |
| Native/BDD discovery | One runnable example in each style, no incomplete engine tests |
| Workflow YAML parsing | Passed with existing local parser |
| Official extension identifiers/settings | Checked against extension documentation |
| Read-only native smoke | Passed against a local AE installation |
| Read-only BDD smoke | Passed against the same local AE installation |
| Form sign-in and saved-state reuse | Verified in a fresh Chromium context |
| `npm run auth:login` | Passed with runtime-only credentials; saved state revalidated in a fresh context |
| `npm run setup:check` | Passed with that temporary state |
| Missing target/credentials and placeholder setup | Expected nonzero failures verified, including native execution |
| VS Code workspace/tasks and documentation links | Checked by support tests |
| Live runner path preflight | Tested for missing, relative, inside-checkout and external paths |
| Private-value scan | Passed; no supplied target/account values, `.env` or `.auth` included |
| Original IoT worktree | Unchanged |

Live verification used runtime-only settings and private temporary state outside
the delivered package. Report generation/evidence were disabled for those runs;
temporary state and test output were removed afterward.

Representative live commands (personal settings required):

```sh
npm run test:smoke -- --reporter=line --output="YOUR_PRIVATE_TEMPORARY_OUTPUT"
npm run test:bdd -- --reporter=line --output="YOUR_PRIVATE_TEMPORARY_OUTPUT"
```

The live examples each passed, proving that an authenticated user can navigate to
Activity and find its heading/search control. They did not submit files or workflows.
Authentication state file permissions were also checked as owner-only on POSIX.

The interactive manual-capture path shares the verified save/fresh-context code,
but a complete human sign-in through that command was not separately performed.

## Not proved by this validation

- Every AE version, UI language, permission model or authentication deployment.
- External SSO/MFA automation, sessionStorage-only login or cross-browser sessions.
- Imaging Engine processing/rendering correctness or output quality.
- Real job launch, cancellation, deletion, cleanup or output comparison.
- GitHub workflow execution on a registered runner.
- A colleague's installed VS Code extensions and GUI behavior.

The VS Code workspace/task JSON and CLI wiring can be validated locally, but
first-day Test Explorer/extension operation should still be checked on the
colleague's own machine. No GitHub repository, runner or schedule was created.

Future changes should run the smallest relevant check, then `npm run quality`
before handoff. Treat unsupported/unfinished regression ideas as design material,
not passing or skipped product coverage.

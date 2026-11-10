# Local execution and optional runners

## First choice: your own terminal

After [local setup](LOCAL_SETUP.md):

```sh
npm run setup:check
npm run test:smoke
```

No service, scheduler or GitHub runner is needed. A command's exit code matters:
nonzero means failure and must not be hidden by a wrapper.

One worker only serializes tests inside one run. Do not run native and BDD at the
same time with one shared account while learning.

## Optional local scheduling

Schedule only after your manual command reliably works.
Use a dedicated QA machine/account if tests become unattended.

| Platform | Optional scheduler | Essential setup |
| --- | --- | --- |
| Windows | Task Scheduler | Program `npm.cmd`, arguments `run test:smoke`, **Start in** starter root |
| macOS | launchd | Explicit node/npm path, WorkingDirectory, stdout/stderr files |
| Linux | cron/systemd timer | Explicit PATH, working directory, log handling, OS browser dependencies |

Tasks should run headlessly for routine tests. Manual capture requires an
interactive desktop; a background service cannot complete a headed MFA login
without an approved alternative strategy.

Conceptual Linux cron command:

```sh
cd /path/to/ae-myworkspace-playwright-starter && /absolute/path/to/npm run test:smoke >> /private/path/myworkspace-smoke.log 2>&1
```

Replace paths privately. No passwords in cron/task arguments. A real schedule
needs a failure notification mechanism; appending a log alone is not monitoring.
Do not add `|| true`, which masks failures.

For Windows, use an approved service/user context and test the Task Scheduler
**Last Run Result**. Do not store passwords in a command-line wrapper.

For macOS/Linux, remember scheduler environments do not inherit your interactive
shell's Node version-manager PATH or VPN state. Do not assume `nvm` initializes.

## Checklist before leaving it unattended

- [ ] Explicit working directory and compatible Node/browser versions.
- [ ] QA account and private state path, not a personal admin account.
- [ ] Network/VPN/DNS/certificate trust available in the scheduled user context.
- [ ] State expiry and recapture owner; no silent automatic login fallback.
- [ ] Only one active run per account; overlapping schedules prevented.
- [ ] Nonzero exit code surfaced with notification.
- [ ] Private log/evidence storage, bounded retention and cleanup.
- [ ] No mutation/engine launch tests in the default smoke.

## Optional GitHub self-hosted runner

A local scheduler runs local commands. A GitHub self-hosted runner receives jobs
from GitHub; it adds remote-code execution exposure and requires stricter controls.

Use a dedicated trusted runner with label `myworkspace-qa`, repository/runner-group
restrictions, protected environment approvals and no untrusted PR triggers.
See [GitHub Actions](GITHUB_ACTIONS.md).

Run Chromium installation and dependency checks under the same OS user as the
runner service. For Linux, arrange browser OS dependencies before live jobs.

Saved state resides at a protected absolute path outside the checkout.
On Windows, set NTFS ACLs for the runner user; on POSIX, restrict owner access.
Do not expose that directory through artifacts, shared drives or broad cache uploads.

The manual live workflow is a starting scaffold, not a guarantee of permanent
unattended auth. Choose and verify an approved login strategy before scheduling.

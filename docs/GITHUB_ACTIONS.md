# GitHub integration: optional, after local success

Nothing is published, committed, scheduled or registered automatically.
You can use the complete starter locally without GitHub.

## Stage 1: put source in an approved private repository

Create the repository yourself using your organization's approved process.
Review `.gitignore` before staging. Commit source, documentation and lockfile only.
Check staged content; no `.env`, `.auth`, output, traces or customer inputs.

Use PRs and require **Starter quality (no AE access)** as a branch-protection check.
Its workflow runs on hosted Ubuntu with Node 22:

```sh
npm ci
npm run quality
```

It does not install browser binaries or access AE; tests are listed, not executed.
Fork PRs need no private secrets or runner access.

### Optional first upload from this standalone folder

Only when your organization approves a new repository, open this package's terminal:

```sh
git init -b main
git status --short
git add .
git diff --cached
# Inspect the staged files before committing; never include private data.
git commit -m "Add My Workspace QA learning starter"
git remote add origin https://github.com/YOUR_ORG/ae-myworkspace-playwright-starter.git
git push -u origin main
```

Create the empty private remote repository first and replace `YOUR_ORG` privately.
Use your organization's approved GitHub authentication; do not embed a token in
the remote URL. VS Code's built-in Source Control view is an alternative.
These instructions are optional: no repository was initialized or pushed for you.

## Stage 2: prepare protected live execution

Most GitHub-hosted runners cannot resolve/reach an internal AE environment without
approved networking. Use a dedicated trusted self-hosted runner or ask your
infrastructure team for an approved networking design.

Before enabling `.github/workflows/myworkspace-live.yml`:

1. Create environment **myworkspace-test** with required reviewers and main-only
   deployment policy, where supported by your GitHub plan.
2. Use a private repository and restrict workflow modification/dispatch permissions.
3. Protect `main`, review workflow changes, and restrict runner-group access.
4. Register a dedicated runner with label **myworkspace-qa**.
5. Configure browser OS dependencies, VPN/DNS/certificate trust and service-user access.
6. Capture the dedicated QA user's state into a protected absolute path **outside
   the checkout**, using that runner's OS account/session where required.
7. Set the environment Variables below; set repository Variable
   `LIVE_TESTS_ENABLED=true` only after all protections are in place.

| Setting | Location | Meaning |
| --- | --- | --- |
| `LIVE_TESTS_ENABLED` | Repository Variable | Explicit gate, exactly `true` |
| `MYWORKSPACE_BASE_URL` | Environment Variable | Your approved entry URL |
| `MYWORKSPACE_AUTH_STATE_PATH` | Environment Variable | Private absolute runner-local file path |

The checked-in workflow contains no target values. If hostnames are sensitive,
store the URL as an environment Secret and change the mapping to
`${{ secrets.MYWORKSPACE_BASE_URL }}`.

Run manually from **Actions > My Workspace live smoke > Run workflow**, using
`main` and selecting native or BDD. Initially leave **upload_reports** false.
No live push/PR trigger or enabled schedule exists.

The gate fails explicitly if enablement or branch requirements are not met.
The live job requires a nonempty URL and absolute state path; it does not silently
fall back to defaults. Environment approval occurs before private runner execution.

## Saved state is a transitional runner strategy

The baseline uses a private runner-local state file. It does not distribute
sessions through workflow artifacts or embed state in Secrets.
Define who refreshes expired state; unattended runs may fail when it expires.

For unattended testing of the supported local AE form, explicitly add an
`auth:login` setup step with dedicated QA credentials from environment Secrets.
For external SSO/MFA, arrange a verified approved authentication strategy;
username/password alone may not be enough. Merely adding Secrets does not change
the shipped saved-state workflow. See [Authentication](AUTHENTICATION.md).

Example optional local-form setup step, after browser installation:

```yaml
- name: Explicit credential setup
  env:
    LOGIN_USER: ${{ secrets.LOGIN_USER }}
    LOGIN_PASSWORD: ${{ secrets.LOGIN_PASSWORD }}
  run: npm run auth:login
```

Use environment Secrets, dedicated QA accounts and least privilege.
Never echo them or record the login flow; masking is not artifact sanitization.
Do not bypass MFA or use a personal admin account.

## Runner and evidence precautions

- Never run untrusted fork/PR code on a runner with AE/network/session access.
- Register a dedicated machine/service user, not a colleague's personal laptop.
- Keep auth outside checkout; protect file access and rotate sessions.
- Clear job-owned evidence/cache data according to policy; never delete broad paths.
- Concurrency serializes this workflow, but independent local workflows/processes
  sharing the account still need coordination.
- HTML/JUnit/logs can expose private URLs and UI text even when traces are off.
- Report upload is explicit opt-in and has short retention. Never publish live
  reports to public Pages. The workflow never uploads `.env`, `.auth` or test-results.
- Browser/runner OS dependencies must be installed under the approved runner policy.

Later scheduling should be enabled only after stable repeatable execution and
agreed account/data ownership. Document timezone (GitHub cron uses UTC), timeout,
refresh owner and failure notifications before adding a schedule.

References:
[Secrets](https://docs.github.com/en/actions/security-for-github-actions/security-guides/using-secrets-in-github-actions),
[environments](https://docs.github.com/en/actions/deployment/targeting-different-environments/using-environments-for-deployment),
[self-hosted runners](https://docs.github.com/en/actions/hosting-your-own-runners).

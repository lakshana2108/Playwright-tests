# Credentials and saved authentication: what to use, when and why

## Recommended approach for smoke tests

The shipped native and BDD smoke tests sign in afresh with credentials for the
verified English local AE login form. Set them in your ignored `.env`:

```dotenv
BASE_URL=https://your-ae-host.example/myworkspace/
LOGIN_USER=YOUR_QA_USER
LOGIN_PASSWORD=YOUR_QA_PASSWORD
```

Run `npm run test:smoke` or `npm run test:bdd`. These local test runs use headed
Chromium; CI remains headless. External SSO/MFA needs a separately approved
authentication strategy and is not supported by the local-form helper.

Do not assume the browser used for your ordinary daily work or VS Code's built-in
browser shares its login with the Playwright test browser.

## Decision table

| Method | Best use | Important limitations |
| --- | --- | --- |
| Manual capture | Exploring a manual session or a flow using saved state | Human login needed; verify the actual UI before saving |
| Saved-state reuse | Flows configured to use a captured session | Expires; environment/account/browser-specific |
| Credentials from private local env | Shipped smoke tests and optional `auth:login` for the verified local AE form | English form/verified input IDs; no external SSO/MFA support |
| Credentials from GitHub Secrets | Approved unattended login | Network, protected environment, QA account and supported MFA policy required |
| Private runner-local saved state | Transitional self-hosted runs | Someone must own refresh; not a permanent unattended solution |

Administrator privileges are not a prerequisite. Ask for a dedicated least-privilege
QA account; add permissions only when an approved regression actually needs them.
Do not share personal admin sessions with colleagues or CI.

## What is `storageState`?

Playwright browser contexts isolate client state between tests.
`storageState` exports cookies, local storage and, with the capture option used
here, IndexedDB. It can contain session tokens capable of impersonating you.

It is **not** a password vault, screenshot, full browser profile, portable SSO
guarantee, or server-side backup. Session storage is not automatically exported.
Some deployments bind tokens to a machine/browser or require extra authentication;
the smoke run after capture is what verifies reuse.

The baseline fixture effectively does this:

```typescript
storageState: async ({ target }, use) => {
  validateAuthState(target.authStatePath);
  await use(target.authStatePath);
}
```

Playwright then creates a fresh context with that state before opening the page.
Fresh contexts do **not** reset server-side jobs, settings, or engine state.

`setup:check` checks JSON/file shape only. A file with empty cookies/origins may be
valid JSON yet unauthenticated; it must not be mistaken for a verified session.

## Keep state separate and private

In your ignored `.env`:

```dotenv
BASE_URL=https://your-ae-host.example/myworkspace/
AUTH_STATE_PATH=.auth/myworkspace-test-qa-chromium.json
```

Use a different file for every environment, account and browser. Firefox/WebKit
are not enabled here; add their projects and corresponding capture strategy only
after checking product support.

Never commit state, send it in chat/email, copy it between colleagues, publish it
as a build artifact, or make a long-lived base64 state secret the default CI design.
The capture uses restrictive POSIX permissions. On Windows, also restrict access
with an appropriate NTFS ACL; POSIX mode bits are not an ACL policy.

Changing `BASE_URL` does not convert an old state file to the new environment.
Change the state path and recapture.

## Expired, missing or invalid state

- Missing/invalid state fails explicitly with recapture instructions.
- Fresh-login smoke tests fail explicitly if credentials are missing or login does not reach the workspace.
- Recapture with `npm run auth:capture`; do not extend timeouts to hide expiry.
- The baseline never automatically consumes optional credentials as a fallback.
- The same failure can mean wrong permissions/language/version; inspect the UI.

Deleting the local state file only stops local reuse. It does not revoke server
sessions or tokens. Sign-out/revocation is a separate account-management action
and is not performed by baseline tests.

Avoid simultaneous runs using one account if the deployment limits sessions or
the tests change shared state. One worker helps within a run; separate processes
still need coordination.

## Optional credential login: explicit local-form command

For the verified English local AE login form, set these privately in your ignored
`.env`, replacing all placeholders:

```dotenv
LOGIN_USER=YOUR_QA_USER
LOGIN_PASSWORD=YOUR_QA_PASSWORD
```

Then explicitly run:

```sh
npm run auth:login
npm run test:smoke
```

The command rejects missing credentials/placeholders, opens headless Chromium,
checks that the login stays on the configured origin, fills the verified form,
clicks `Sign In` once, verifies navigation, validates state reuse in a fresh context,
and saves private state. No login screenshots, trace or video are recorded.

The verified inputs lack accessible labels, so the tiny login helper uses their
observed stable IDs (`ae_input_login_username` / `ae_input_login_password`) as a
documented CSS fallback. Do not guess labels from displayed text.

The shipped smoke tests use these variables for a fresh login on each run;
`auth:capture` still ignores them and asks you to sign in manually.

An unsuccessful sign-in or changed form fails rather than saving state. Inspect
the login manually to distinguish invalid credentials, permission problems and
MFA; the starter does not claim a complete product-specific error classifier.

For another version/language or external SSO, verify/adapt the helper or use manual
capture. Never insert a generic guessed fallback that submits credentials to
an unexpected origin.

Do not force-log-out other sessions or bypass MFA to make automation run.
SSO/MFA may require manual capture or an approved service-account mechanism.

## Local secrets versus GitHub Secrets

| Setting | Local | GitHub |
| --- | --- | --- |
| My Workspace URL | Ignored `.env` | Variable, or Secret if hostname sensitivity requires it |
| Username/password | Optional ignored `.env` for verified adapter | Environment Secrets `LOGIN_USER` / `LOGIN_PASSWORD` |
| State path | `AUTH_STATE_PATH` in `.env` | Variable pointing to a private runner-local file |
| State contents | Private `.auth` file | Not an uploaded artifact or default portable Secret |

Example optional credential setup step to add to a trusted live workflow:

```yaml
- name: Explicit local-form login (optional)
  env:
    LOGIN_USER: ${{ secrets.LOGIN_USER }}
    LOGIN_PASSWORD: ${{ secrets.LOGIN_PASSWORD }}
  run: npm run auth:login
```

Place it after dependency/browser installation and before `setup:check`.
The job must already have the approved `BASE_URL` and protected `AUTH_STATE_PATH`.
The shipped workflow uses saved state only; it does not enable credential login
or require these Secrets automatically.

Expose credentials only to that trusted step. GitHub masking does not
sanitize screenshots, traces, HTML, encoded values or authentication requests.

## Network and evidence cautions

Use HTTPS; HTTP exposes credentials/session tokens in transit. Configure approved
internal trust rather than globally ignoring certificate errors.
VPN/network access is required independently of a valid session.

Reports, failure messages, DOM snapshots and screenshots can reveal user/job data.
Keep local evidence private; opt into failure capture deliberately with
`PW_CAPTURE_EVIDENCE=true`. Never record the login flow.

Official reference: [Playwright authentication](https://playwright.dev/docs/auth).

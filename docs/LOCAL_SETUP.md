# Local setup: the first priority

You do not need GitHub, a runner service, a cloud account or any shared credentials
to learn and run this starter locally.

## 1. Prepare your machine

- Install a current Node.js 22 LTS release (22.13 or newer) with npm.
- Install VS Code; open the standalone starter folder.
- In the integrated terminal, run `node --version` and `npm --version`.
  Restart VS Code after installing Node if its terminal cannot find npm.
- Optional: with an already installed Node version manager, `nvm install` and
  `nvm use` read `.nvmrc`. Windows managers may require `nvm use 22` instead.
- Arrange an approved AE test installation and dedicated QA user with the
  permissions needed to view Activity. Administrator rights are not required.
- Confirm you can access the environment manually, including VPN, DNS and TLS.

This starter uses the real web app; it does not install Automation Engine or
Imaging Engine. Engine licenses, approved tickets and test inputs come later.

## 2. Install and verify the foundation

```sh
npm ci
npm run setup:browsers
npm run quality
```

`npm ci` installs exactly the committed lockfile. `setup:browsers` installs
Chromium matching the installed Playwright version. On Linux you may need
`npx playwright install --with-deps chromium` with approved OS package permissions.

Expected: quality passes and lists one native test and one BDD scenario, even
without `.env`. There is no AE connection in this phase.

## 3. Configure your environment

Copy `.env.example` to `.env` and edit it privately:

```dotenv
BASE_URL=https://your-ae-host.example/myworkspace/
AUTH_STATE_PATH=.auth/myworkspace-chromium.json
PW_CAPTURE_EVIDENCE=false
```

The URL above is deliberately a placeholder and is rejected by live commands.
Use your own actual My Workspace entry URL, preserving its path. Do not add
credentials to the URL. The tests navigate using UI links rather than constructing
installation-specific routes.

Shell/CI environment variables override `.env`. If settings seem ignored, check
whether your terminal has previously exported a value.

Prefer HTTPS. Use approved internal certificate trust rather than enabling
`ignoreHTTPSErrors` globally. HTTP sends credentials/session traffic unencrypted.

## 4. Capture your own sign-in

```sh
npm run auth:capture
```

Sign in within five minutes. Use the actual login mechanism your deployment
requires. The command checks for the authenticated `Activity` navigation link
before validating reuse in a fresh context and saving cookies/local storage/IndexedDB
to the configured state path.

Manual capture does not type credentials, record a login trace, launch workflows
or change preferences. The browser closes after capture.
For the verified local AE form, optional `npm run auth:login` signs in headlessly
using private credential variables; see the authentication guide first.

See [Authentication](AUTHENTICATION.md) if the UI language differs, sessions
expire, or your installation uses authentication not represented by storage state.

## 5. Run and inspect

```sh
npm run setup:check
npm run test:smoke
npm run test:bdd
npm run report:native
```

Expected: both examples navigate to Activity and find the heading/search box.
An expired state should fail with authentication guidance, not pass by seeing
an Automation Engine logo on the login page.

For watched execution: `npm run test:headed`.
For debugging: `npm run test:debug`.
For BDD UI mode: `npm run test:bdd:ui`.

Failure evidence is disabled by default. To retain local failure screenshots and
traces, set `PW_CAPTURE_EVIDENCE=true` in your private `.env`, rerun, then use
`npx playwright show-trace "YOUR_TRACE_ZIP_PATH"`.
Do not share evidence before checking it for sensitive data.

## First-run checklist

- [ ] Node/npm visible in VS Code's integrated terminal.
- [ ] Dependencies and Chromium installed.
- [ ] Quality passes without credentials.
- [ ] Native and BDD tests discovered separately.
- [ ] Personal approved target configured privately.
- [ ] Login captured into an ignored state file.
- [ ] Native smoke passes; BDD equivalent passes.
- [ ] Can explain each assertion and open a report.

## Moving the package to another colleague

Share source files, documentation and the lockfile, not your `.env`, `.auth`,
node_modules, generated tests, reports or downloaded inputs/outputs.
The colleague repeats installation and captures their own login.

# Discover your real My Workspace before expanding coverage

The starter uses the real app, not a synthetic page. A small English-language UI
contract was observed during read-only discovery, but this is not a universal
product-version guarantee.

## Verified starter surface

- Login: `SIGN IN` heading and `Sign In` button.
- Authenticated navigation includes `Jobs`, `Drop File`, `Products`, `Files`,
  `Activity`, and `To Do`.
- Activity: `Activity` level-one heading and `Search` searchbox.
- Observed Activity columns: `Input Files`, `Workflow Name`, `Launched at`,
  `State`, `Actions`.

Only authenticated navigation, the Activity heading and search control are
asserted by the baseline. No rows, workflow names, usernames, input filenames,
hostnames or customer data from discovery are shipped.

Displayed login text did not establish accessible input labels. Further local
inspection verified the username/password input IDs, and local form sign-in plus
saved-state reuse were tested. The optional credential command uses that narrow
documented contract, not a claim of universal SSO support.

## Fill this worksheet privately

| Question | Your answer |
| --- | --- |
| AE version and web app language | |
| Approved environment owner | |
| Required VPN/DNS/TLS trust | |
| QA account permissions, not password | |
| Actual login mechanism and expiry | |
| Auth state reuse works in fresh context? | |
| Available workspace areas | |
| Imaging Engine tasks/tickets exposed here? | |
| Owned sample inputs and approved expected output | |
| Which actions launch/cancel/delete/change data? | |
| How can a run be uniquely correlated? | |
| Expected loading/empty/error/terminal UI states | |
| Cleanup owner and allowed evidence retention | |

Do not fill the committed guide with real secrets or private environment details.
Keep any environment-specific worksheet in an approved private location.

## Discovery steps

1. Sign in manually with a least-privilege QA account.
2. Inspect navigation and headings using Playwright's locator picker.
3. Verify a locator's role/name/uniqueness, not just the visible text.
4. Observe loading and empty states without changing shared records.
5. Record candidate read-only assertions in plain language.
6. Agree on approved test inputs/tickets before launching anything.

Do not treat admin-only Drop File edit/add controls as universally available.
Do not interact with a drop zone merely to learn selectors: it may start work.

For another language/version, adapt `tests/support/myworkspace.ts` once and rerun
both styles. Do not scatter translation guesses or fallback selectors across steps.

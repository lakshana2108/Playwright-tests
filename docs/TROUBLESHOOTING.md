# Troubleshooting without hiding failures

| Symptom | First check |
| --- | --- |
| npm/Node not found | Install Node; restart VS Code; check terminal PATH |
| `npm ci` fails | Supported Node version, registry/proxy access, lockfile |
| Chromium executable missing | `npm run setup:browsers` |
| BASE_URL missing/placeholder | Copy/edit your private `.env`; check shell overrides |
| Authentication state missing | `npm run auth:capture` |
| Invalid state JSON/shape | Recapture; do not hand-edit tokens |
| Login page instead of Activity | Expiry, wrong environment/state, required MFA |
| Activity link not found | Account permissions, language/version, actual login |
| DNS/connection timeout | VPN, hostname resolution, AE service reachability |
| Certificate failure | Approved CA/trust setup; do not globally disable TLS checks |
| Strict locator matches several controls | Scope to navigation/panel and exact name |
| BDD missing or ambiguous step | `npm run bdd:gen`; check unique step expressions |
| Old BDD behavior in editor | Regenerate; refresh Test Explorer; correct config |
| Both learning examples run twice | Select one config/project; compare test listing |
| Report folder missing | Run that suite first; use corresponding report command |
| No failure trace | Evidence is opt-in; set `PW_CAPTURE_EVIDENCE=true` privately |
| Quality passes but live fails | Static quality is not AE connectivity/session proof |

## Diagnose in order

1. Run `npm run quality`: isolate local source/config problems.
2. Run `npm run setup:check`: isolate settings/file-shape problems.
3. Confirm manual target access/VPN.
4. Recapture personal state if needed.
5. Run `npm run test:debug` or the BDD debug equivalent.
6. Inspect the actual control/ready condition with the locator picker.
7. Classify product failure versus setup/network/data/locator failure.

Do not catch errors and return success, add arbitrary sleeps, use forced clicks
as a default, or increase every timeout. Check what measurable condition is missing.

## Safe evidence handling

Even without screenshot/trace capture, error logs and HTML can include private
URLs or UI text. Review evidence before sharing. Never upload `.auth`/`.env`,
login recordings or raw request headers. Use minimal redacted descriptions when
asking for help.

## Auth cleanup

To stop local reuse, delete only your own specific `.auth` state file using your
file explorer. That does not revoke the remote session. Ask the account/environment
owner for approved revocation if tokens were exposed.

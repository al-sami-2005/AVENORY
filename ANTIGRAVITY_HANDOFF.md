# Antigravity engineering handoff — VOWMERA Edition Five

## Product objective

Continue the **existing** original responsive 90-day personal growth tracker, preserving all data and retaining its private-first character. The shipped app is a functional **local-first PWA**, not yet a cloud-connected product or native mobile binary. Make every primary action accessible within 1–2 taps, and deliver premium calm/expressive design without introducing slow animations, inaccessible low-contrast type, bloated dependencies, or needless complexity.

## Read this project in order

`README.md`, `PRODUCT_RESEARCH.md`, `QA_RELEASE_NOTES.md`, `AGENTS.md`, `supabase/schema.sql`, this handoff. Read `index.html`, `app.js`, `styles.css`, `vowmera.css`, `edition-five.css`, `cloud-config.js`, and `sw.js` before editing. Legacy log schemas and storage keys are intentional. **Never rebuild from scratch.**

## Phase 1 — finish robust local product QA and UX

1. Run `node --check app.js`, `python tests/test_v5.py`, `python tests/test_timer_logic.py`. Install Playwright/Chromium if missing.
2. Review new components: today's Next Three Moves, interactive 30-day signal, quote rotator, inline timer custom 1–180min, named presets, early finish/partial actual-minute logging, 14-day habit lens, life-area compass, mood mirror. Make sure no display derives from imaginary observations; calculate from saved logs.
3. Independently regression-test each older feature: yes/no, min/max habits, editing/scheduling, project dates/time, past-day check-ins, focus-linked progress, pause/resume/reload/day boundaries, XP reversibility/achievements/reward spend, 90-day journey, week/month stats, private Reset, reflection, backup/import, CSV/ICS export, saved quotes, browser notifications, login UI, theme, offline.
4. Validate accessibility: WCAG 2.2 AA keyboard and screen-reader audit, focus rings/traps/announcements, font scaling 200%, contrast, reduce-motion, and 320–1440px responsiveness. Add automated regression tests and screenshots where useful.
5. Harden timer edge cases: zero/negative times, invalid custom presets, background tabs, clock skew, off-by-one seconds, pause at midnight, restore after browser force-quit, stopwatch, early finish and duplicate session entries. Make focus templates sync safely when cloud gets connected.
6. Prevent data loss during updates: add unit/backup tests for schema upgrades and export/import; preserve `ninety-track-v1`, old `ninety-v3-user-{uid}` account caches and `ninety_profiles` cloud interface. Export user data before changing origins or resolving conflicts.

## Phase 2 — Supabase: ONLY after owner approval

The project owner has a free Supabase project, but this release intentionally leaves `cloud-config.js` blank. **Do not connect automatically**. On authorization, run the owner-reviewed `supabase/schema.sql` in Supabase SQL Editor, check row-level security and the `ninety_write_state` function; use only the project URL and `sb_publishable_*` key in the static client. Never place `sb_secret_*`, service role, SQL database password, tokens or private journal data in the repository. Test email confirmation/password reset/redirect URLs, owner isolation with distinct users, laptop ↔ phone account sync, offline edits, and bidirectional conflict recovery. Add durable account data export/delete before launching publicly. A table existing does not prove RLS or syncing works.

## Phase 3 — publish website cheaply

Publish only `index.html`, `styles.css`, `vowmera.css`, `edition-five.css`, `app.js`, `cloud-config.js`, `sw.js`, `manifest.webmanifest`, and `assets/` via free Cloudflare Pages static hosting (or equivalent). **Never deploy SQL/admin docs/tests** publicly. Test HTTPS, responsive layout, service-worker update and cache invalidation, install behavior, load speed on low-end Android, and auth redirects after cloud activation. Rollback to prior deploy on regression.

## Phase 4 — native mobile app

After web stability, use Capacitor for Android with native local notifications, runtime permissions, battery/do-not-disturb testing, time zone and device-restart rescheduling. A PWA alone cannot guarantee time-triggered reminders when closed; calendar `.ics` remains the free fallback. iOS native support requires a separately validated Apple toolchain/developer distribution approach. Prove user data migration before replacing local PWA storage; a Capacitor app has a distinct origin.

## Deliverables from next engineering phase

- A change log per feature (what changed, why it is more usable).
- Real reproducible pass/fail tests and bug reports; do not say '100% perfect'.
- Before/after screenshots and independent desktop/phone accessibility results.
- Exportable source/build ZIP, deployment instructions and rollback plan.
- Actual web URL / store build **only** after hosted/tested; label mockups as previews.

Privacy: maintain discreet `Clear Mind` goal and supportive non-shaming recovery language; don't add streak punishment. The name/mark VOWMERA is not confirmed legally clear. Keep future costs opt-in.

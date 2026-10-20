> **Edition Five:** Deploy `edition-five.css` alongside the earlier stylesheets and use the exact `vowmera-v5` site folder. Cross-device sync is not active until the owner authorizes Supabase configuration, applies schema/RLS, and tests real accounts. See `README.md` and `ANTIGRAVITY_HANDOFF.md`.

# Ninety 3.0 — Supabase cloud + free hosting + future mobile app

## What you will pay

**The website can be hosted for free** on Cloudflare Pages's free tier. Supabase's Free plan can be used for an individual/personal project with limits (database size, monthly users, API traffic), and may pause inactive projects. No paid service is required to test this build. A custom domain is optional and not free, and publishing an iOS App Store app typically requires Apple's paid developer membership. Third-party plans and quotas can change.

## Phase 1: create your cloud database (20–30 minutes)

1. Visit <https://supabase.com/dashboard>, create an account, choose **New project**, give it a project name (e.g. `ninety-personal`), set a strong database password and choose a nearby region. **Keep the database password private**.
2. After provisioning, open **SQL Editor**. Open `supabase/schema.sql` from this project, paste the SQL and run it once. It creates `ninety_profiles`, enables Row Level Security (RLS), and creates the `ninety_write_state` transaction-safe synchronization function.
3. In Supabase check the database table `public.ninety_profiles`, ensure RLS **enabled**, and verify the policies `ninety_select_own`, `ninety_insert_own`, `ninety_update_own` exist. Do **not** disable RLS or add a public/anonymous read policy.
4. Under **Project Settings** find the **Project URL** and the **publishable key** (or legacy `anon` key). Add them to `cloud-config.js` only:

```javascript
window.NINETY_CLOUD = {
  url: 'https://YOUR_PROJECT_REF.supabase.co',
  anonKey: 'YOUR_PUBLIC_PUBLISHABLE_OR_ANON_KEY'
};
```

5. **Never** put `service_role`, `sb_secret_*`, a private key, SQL admin password, or database credentials into any front-end file or git commit. The URL and public API key are meant to be visible to web users; user privacy depends on login + RLS.
6. Go to **Authentication → Providers → Email** and ensure email/password auth is enabled. Consider keeping email confirmation ON (recommended) and adjust its URLs in the next phase. New sign-ups may receive a confirmation email. Rate limits and mail delivery apply.

## Phase 2: deploy the free website

### GitHub + Cloudflare Pages (recommended)

1. Create a GitHub repository for the site. Push everything **except local backups and secrets**. The public config key is not a secret; never push private tokens.
2. Visit <https://dash.cloudflare.com/> → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**. Authorize GitHub and select your repository.
3. Choose **no framework / static HTML** with no build command. Ensure the deployment root contains `index.html` (or set the project root to `ninety-v3` if that is the folder you committed).
4. Deploy and save your HTTPS address, e.g. `https://ninety-you.pages.dev`.
5. In Supabase go to **Authentication → URL Configuration**. Set **Site URL** to the deployed `https://...pages.dev` origin; configure allowed Redirect URLs if your authentication/email templates use redirects. Avoid `localhost` as the production Site URL.
6. Open the hosted site on both a desktop and your phone. Email sign-in requires working HTTPS and network access. Refresh after deploying `cloud-config.js` if an earlier offline service-worker cached version exists.

### Using the Cloudflare drag-and-drop upload

You may alternatively upload the `ninety-v3` files using Cloudflare Pages Direct Upload. Remember to include `cloud-config.js` and `supabase/schema.sql` only as local project documentation; static hosting can serve SQL files publicly if uploaded. For production, it is preferable to **exclude `supabase/`, tests and internal instructions** from your hosted public artifact. The public site needs only `index.html`, `styles.css`, `app.js`, `cloud-config.js`, `sw.js`, `manifest.webmanifest`, and `assets/`.

## Phase 3: verify cloud syncing on two devices

1. On laptop: open the deployed site and **Create account**. Confirm your email if Supabase requests it; sign in manually afterward.
2. Tick one daily habit, create a project and complete a test 1-minute focus session. On **Account** tap **Sync now** and confirm **Synced just now**.
3. On phone: open the same deployed URL, sign into **the same account**, and confirm the habit, project, and completed session appear. If not, wait for periodic refresh, reload, or check account sync status. Running timer countdown does **not** synchronize across devices, but completed history does.
4. Mark a second habit on the phone; verify laptop receives the change on focus/poll/reload.
5. Disconnect a device temporarily and change data on both. Check the **Account** conflict-resolution UI. Export JSON backups before choosing the cloud or local version.
6. In Supabase create a *second* test user. Confirm they cannot read the first account's data (RLS must prevent it). Perform a real authorized/unauthorized API test before public launch.
7. Back up with Settings → Export JSON. Supabase's free plan does not include all backup/recovery features of paid plans.

## Phase 4: notifications that really work

**Currently implemented**: optional browser notifications while the site runs and calendar `.ics` reminders. They depend on permission, foreground state and browser/OS handling. Browser reminders are **not guaranteed while closed**. A Supabase database alone does not send scheduled notifications.

**For the eventual Android app**, ask Antigravity to:
- Wrap this PWA using Capacitor (after the web project is stable).
- Implement `@capacitor/local-notifications` for habit reminders, morning/evening routines, break completion, scheduled checks, and rescheduling after boot/time-zone changes, while respecting Android permission and battery restrictions.
- Persist a running countdown as timestamp + duration; show an accurate result on reopen. Do not award a session more than once.
- Test actual behavior on Android phones with battery optimization, Do Not Disturb, background restrictions, locked screens, and denied notification permissions.
- Keep the free Supabase setup and authentication. Add optional FCM/other push only if truly needed and after reviewing its pricing/security obligations.

**For iOS**, plan native notification permissions and local scheduling separately; an Apple developer account and App Store publishing have separate requirements and possible fees.

## Research-informed features

- TickTick: attached-to-task Pomodoro, stopwatch, statistics (https://help.ticktick.com/articles/7055782010496745472 and https://ticktick.com/features).
- Forest: focus sessions, visual rewards, focus timeline, ambient sounds, tags (https://play.google.com/store/apps/details?id=cc.forestapp).
- Session: task intention + mindful reflection, activity review, multi-device sync (https://www.stayinsession.com/).
- Security/cost: Supabase RLS (https://supabase.com/docs/guides/database/postgres/row-level-security) and free plan (https://supabase.com/pricing).
- Browser notification limitations: MDN (https://developer.mozilla.org/en-US/docs/Web/API/Notifications_API).

These products informed feature selection; Ninety is an independent, original implementation, not affiliated with them.

## Known limitations / future roadmap

- Database connection is **not live in the downloaded ZIP** because only the owner can create the Supabase project and supply its public configuration. Backend integration has been exercised against a mocked REST service, not a live account yet.
- Whole-profile JSON syncing with explicit conflict resolution; no automatic field-level merge or live collaborative edits. Optimize with per-log row updates + migrations if supporting many devices/users.
- True end-to-end encryption is not implemented. Add if handling higher-risk private journaling; user notes are guarded by RLS, not client-held encryption keys.
- No online payment, advertisements or subscription dependencies.
- Offline guest mode works on the device; cloud changes queue locally while offline, and have to be resolved when accounts have divergent edits.
- PWA installation and prompt availability vary by browser/OS.
- Password reset UI, account deletion/export from server, rate limiting, accessibility audits, timezone synchronization, automated Postgres integration tests, and edge-case conflict UX are recommended before a public launch.

> **Edition Five:** Deploy `edition-five.css` alongside the earlier stylesheets and use the exact `vowmera-v5` site folder. Cross-device sync is not active until the owner authorizes Supabase configuration, applies schema/RLS, and tests real accounts. See `README.md` and `ANTIGRAVITY_HANDOFF.md`.

# Free deployment and Supabase connection (when you approve it)

**Right now:** VOWMERA is intentionally local-first. You can test the site as a guest. If you want a URL to preview on multiple devices before cloud login, deploy the static files; this will NOT automatically sync progress across devices.

## Free Cloudflare Pages deployment

1. Open https://dash.cloudflare.com/ and choose **Workers & Pages → Create → Pages → Direct Upload** (interface wording may change), or connect a GitHub repo.
2. Upload the contents of the **deploy-only ZIP** (not the complete developer ZIP). It includes `index.html`, CSS, JavaScript, offline worker, manifest, and icons only.
3. Deploy and open the `https://YOUR-SITE.pages.dev` URL. Check the application can open, guest start works, and install prompts work in supporting browsers. Use privacy mode or a test account for demos.
4. Take JSON backups before changes to domain/origin because browsers do not share localStorage across different sites.

## Later: Supabase on your account

1. In your own Supabase project, open **SQL Editor** and run `supabase/schema.sql` from the complete ZIP. Verify RLS on `ninety_profiles` and policies that restrict read/write to the authenticated user. Test with two users and review function permissions before enabling sign-up.
2. Configure email/password sign-in and require email verification where suitable. Add your actual Pages URL in **Authentication → URL Configuration** as the Site URL; allow required redirect paths. Do not confuse this with Next.js server-side example code in Supabase's Connect panel; VOWMERA uses static JS.
3. Add your **public** project URL and publishable/anon key to `cloud-config.js`. It intentionally still uses `window.NINETY_CLOUD` for compatibility with existing JS; don't rename the property without changing the code.
4. Deploy the updated site and open it on laptop and phone. Before first cloud bootstrap, export the original local JSON. Test migration and conflict resolution with a disposable account before using real progress.
5. Validate RLS and database function access; errors should be fixed without disabling RLS or exposing any elevated keys in browser scripts.

## Notifications

In-page reminders depend on an open tab; calendar file export is the reliable no-server fallback subject to calendar app import and permissions. The Supabase database does not itself schedule native notifications. Android native notifications are a future Capacitor task. Hosting and database free tiers have quotas and may pause inactive projects.

## Production checklist (not all complete)

- [ ] Real Supabase two-account RLS test
- [ ] Cross-device sync and conflict test
- [ ] Password reset and account deletion implementation
- [ ] WCAG 2.2 AA keyboard/screen reader audit
- [ ] Device notification permission/lock-screen tests
- [ ] Full automated timer and timezone regression suite
- [ ] Confirm brand name and legal/domain availability
- [ ] Real-world performance test on low-end phone

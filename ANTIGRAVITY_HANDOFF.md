# AVENORY V7 · Antigravity handoff

Use this extracted V7 project as the only code baseline. Preserve the current GitHub/Cloudflare configuration and existing database schema. Do not rebuild from scratch or change data keys. Read `README.md`, `DEPLOY_V7.md`, `V7_QA_REPORT.md`, and `supabase/schema.sql`.

1. Run `node --check app.js`, then V7 browser tests and the previous regression tests.
2. Test actual Supabase signup, existing session renewal, Google OAuth, password reset, offline return, cross-user RLS checks and conflict resolution with real test accounts. A public URL/key in `cloud-config.js` does not prove account sync.
3. Review V7's saved-message settings addition; guarantee old JSON snapshots still load unmodified.
4. Confirm the new quote selection is context-specific, doesn't repeat too often, never interrupts task editing, respects reduced-motion, and doesn't imply clinical treatment.
5. Audit mobile touch targets, screen-reader labels, contrast, focus management and real Android/iOS devices.
6. Push extracted source files to the existing GitHub project, preserving version control history. Configure Cloudflare Pages build command and output directory per `DEPLOY_V7.md`, verify the live URL and Supabase Auth redirects.
7. Do not paste secret Google OAuth or service-role keys into public frontend files or logs.
8. Prepare Capacitor native notifications as a separate, user-approved phase after real web QA passes.

Do not claim the website is deployed or live tests passed until you have actual evidence.

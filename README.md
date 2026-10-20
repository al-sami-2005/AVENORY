# AVENORY · Field Notes Edition V7

**Tagline:** Small days. Brave changes.

This is a no-build-step static web app with the existing 90-day habits, projects, timers, progress analytics, rewards, reset tools, Supabase account support, and offline-capable PWA assets.

## What's new in V7
- Refreshed responsive homepage, cinematic editorial quote book and a hand-authored A crest, plus original matching focus/calm/growth/rewards marks.
- Contextual copy in Today, Habits, Focus, Projects, Progress, Rewards, Reset and account-related screens. Quotes rotate deterministically every nine minutes; reduced-motion is respected.
- Save a thought via the small heart; saved thoughts are in Reset Space. Legacy saved quotes are retained.
- Returning users with a saved session see their own cached page immediately; network outages no longer automatically log out valid sessions. Auth tokens refresh through Supabase; if credentials become invalid, a new sign-in is required.
- Added a next-small-step panel, fewer visual dead zones, creative 'Al Sami' maker's seal and stronger mobile composition.
- Private Supabase profile remains `public.ninety_profiles` and the RPC is `ninety_write_state`. **Database keys/storage names are not renamed.**

## Files
- `index.html` + `app.js`: functional site
- `styles.css`, `avenory-core.css`, `avenory-components.css`, `avenory-signature.css`, `avenory-v7.css`: original and upgraded visuals
- `cloud-config.js`: YOUR EXISTING PUBLIC Supabase URL and publishable key (safe to embed only with authenticated RLS)
- `sw.js`, `manifest.webmanifest`, `assets/`: PWA/offline and logos
- `supabase/schema.sql`: only for the Supabase SQL Editor; **never upload this file publicly**
- `scripts/prepare_deploy.py`: packages only public site resources
- `tests/`: automated browser tests

## Local setup
Use an HTTP server, not double-click file URLs for full PWA behavior:
```bash
python3 -m http.server 8000
```
Open `http://localhost:8000`.

## Cloud + login
The public Supabase URL/key from V6 are preserved; sign-in and Google OAuth must be tested with your actual account, callback allowlist and deployed hostname. The public key is not a substitute for RLS. Existing account rows and user data are intentionally unchanged. Running timers are local to a device; completed history is part of the account snapshot.

## Free GitHub + Cloudflare Pages
1. Commit THIS folder's source files to the existing GitHub repository's deployed project root; do not nest `AVENORY-V7/` inside the root unless you update its build root.
2. In Cloudflare Pages Git integration use: **Framework: None**, **Build command: `python3 scripts/prepare_deploy.py`**, **Output directory: `dist`**. Deploy preview branches before production when possible.
3. Push to the connected Git branch. Cloudflare automatically triggers builds *only when that Git integration is correctly connected and deployment succeeds*. No deployment has been triggered in this chat.
4. In Supabase Auth URL Configuration set Site URL to the actual Pages `https://...pages.dev` URL, and allow the HTTPS redirect for login and password recovery.
5. Test real email/Google login, password reset, private account isolation, two-device sync and conflicts.

See `DEPLOY_V7.md` for full details. Back up V6 data before replacing its code.

## Limitations
The app does not guarantee closed-browser notifications; reliable mobile scheduling requires a native app and OS permission. There is no server-side multi-device live merge; simultaneous edits use revision-protected snapshot conflict handling. The browser checks supplied here do not constitute a live Supabase or production deployment audit.

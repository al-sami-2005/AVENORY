# Start here — AVENORY V7

1. Open `Release/AVENORY-V7-Interactive-Preview.html` for a self-contained guest-mode preview.
2. `index.html` is the actual website entry. Do not rename it or `app.js`.
3. `README.md` explains the version, storage and preview.
4. `DEPLOY_V7.md` explains how to push the EXTRACTED source into your existing GitHub repository and use Cloudflare Pages (`python3 scripts/prepare_deploy.py`, output `dist`).
5. `ANTIGRAVITY_HANDOFF.md` covers live Supabase/OAuth QA and app follow-up.
6. `Release/AVENORY-V7-Deploy-Website.zip` is the separate direct-upload site-only bundle; it excludes SQL and tests.
7. Back up your existing progress before installing an update.

The public Supabase connection data are already in `cloud-config.js`. Do not add any secret keys there. Real sign-in and two-device sync have not been verified in this environment.

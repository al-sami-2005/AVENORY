# AVENORY V7 · Git-connected, free Cloudflare Pages deployment

## Before any push
- Export a JSON backup from the currently deployed version.
- Confirm Supabase SQL schema exists (`public.ninety_profiles` table, RLS, `ninety_write_state` RPC).
- Confirm OAuth Client Secret was rotated if previously displayed in screenshots. **Never put the Client Secret in a Git repo, static site, or this chat.**
- Do not change the `ninety-track-v1` / `ninety-v3-*` local keys or Supabase table names.

## Push to your existing connected GitHub repository
1. Extract `AVENORY-V7-Complete-Project.zip`.
2. Copy files from inside `AVENORY-V7/` into the corresponding folder of your existing GitHub repository (where `index.html` currently lives). Merge rather than deleting repository metadata.
3. For a preview deployment, create a feature branch if your Cloudflare Pages Git setup supports previews. Run the tests and verify the preview before merging into the connected production branch.
4. Commit and push the changes to the branch connected to Cloudflare Pages. **A ZIP upload to GitHub will not automatically replace the website source; commit the extracted files.**
5. Confirm Cloudflare Pages is still linked to the same repository and target branch. Set:
   - Root directory: folder containing the project files (normally repository root)
   - Framework preset: None
   - Build command: `python3 scripts/prepare_deploy.py`
   - Build output directory: `dist`
6. Watch the deployment log. `prepare_deploy.py` creates a static `dist/` with only the necessary assets, including `_headers`; private SQL/test files are NOT copied.
7. Test the actual new `*.pages.dev` URL on your laptop and phone.

## Local release command
`python3 scripts/prepare_deploy.py` generates `dist/` and `AVENORY-V7-Deploy.zip` for optional direct Cloudflare upload instead of Git. For Git-connected sites, use automatic Git builds rather than direct uploads to avoid mismatched build history.

## Supabase production checklist
- Your current public publishable key / project URL live in `cloud-config.js`. Do not introduce `service_role`, database password, Google OAuth secret or `sb_secret_*` values there.
- In **Supabase > Authentication > URL Configuration**, use your real Pages HTTPS origin as Site URL and add the allowed redirect(s) for your login and password recovery flow.
- Configure the **Google OAuth provider** inside Supabase with Google's Client ID and *private* Client Secret. This app's JS should only initiate the Supabase OAuth authorization URL; it should never store the Google Client Secret.
- Verify the production site supports: reload keeps a signed-in session; sign-out actually signs out; no account can read another user's records; a second device sees synced changes; revising concurrent records raises a conflict and preserves backups.

## Not included
- This chat could not push to your GitHub repository or prove the Cloudflare production build worked.
- No native Android/iOS packages or guaranteed closed-browser reminders.
- A live authenticated database and OAuth end-to-end test was not run here.

# Deploy and verify AVENORY

1. Extract the complete source ZIP locally. Back up existing browser or database records first.
2. Run `python scripts/prepare_deploy.py` to create `dist/`.
3. Upload `dist/` or `AVENORY-V6-Deploy.zip` to Cloudflare Pages; alternatively use GitHub deployment to automate subsequent changes.
4. Confirm deployment HTTPS URL and update **Supabase → Authentication → URL Configuration** Site URL and allowed redirect URLs to your exact hosted domain.
5. In Supabase **SQL Editor**, run the included `supabase/schema.sql` only after reviewing it. Confirm table `ninety_profiles`, RLS and the RPC `ninety_write_state`. This action was reportedly done by the user earlier, but the updated code has NOT independently reverified live database permissions.
6. Using *two distinct test users* verify registration, Google OAuth, own data CRUD, blocked cross-account access, and session recovery. Using the same user on two devices verify check-ins and notes; wait for explicit sync status. Test conflicts by editing both devices before a refresh and choose a backup path deliberately.
7. Run Lighthouse, keyboard/VoiceOver or TalkBack accessibility audit and a locked-phone reminder reality check before claiming production quality.
8. Install PWA via browser menu; for native notifications plan Capacitor later. Google/Apple store publishing may cost money.

Only a publishable/anon key belongs in `cloud-config.js`. Never put service_role, sb_secret, OAuth client secret, or a database password into static files.

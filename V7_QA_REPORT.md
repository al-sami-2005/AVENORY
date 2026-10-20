# AVENORY V7 · QA notes

**Automated Chromium checks completed:** navigation on 320 / 360 / 390 / 430 / 768 / 1024 / 1440 px, no horizontal overflow on Home/Habits, guest entry, return to Home from Habits, dynamic quote component presence, feature-specific notes, private reflection autosave and restore, custom 37-minute Focus timer, account cached-dashboard restore with an intentionally failed auth-user request, and no observed page errors in those scenarios.

**Security/data design:** keys `ninety-track-v1`, `ninety-v3-auth-session`, account caches, `ninety_profiles` / `ninety_write_state` unchanged. Legacy favorite quotes preserved; new field notes added as optional settings. The user-specific local state is selected on page bootstrap to avoid showing guest data when signed in.

**Limits:** browser tests use isolated embedded HTML with mock localStorage because browser local-file and localhost navigation is disabled here. Real Supabase requests, Google OAuth, access policy, GitHub builds, Chrome iOS/Android notification behavior, full WCAG audits, and multi-tab race conditions need testing in your deployed environment. Claims of 100% bug-free or million-dollar design would be unfounded.

**Extra security:** If your Google OAuth client secret was shared in a screenshot, rotate it before launch.

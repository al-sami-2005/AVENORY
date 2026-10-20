# AVENORY — Edition Five

**A private-first, responsive, installable 90-day personal growth and habit tracker.**

AVENORY Edition Five is a high-performance, accessible, static Progressive Web App (PWA) designed for desktop, tablet, and mobile. Built entirely with vanilla HTML5, scoped modern CSS, and vanilla JavaScript, AVENORY requires no Node.js backend, no heavy frameworks, and zero paid runtime dependencies.

---

## Highlights

* **Focus Studio:** Arbitrary custom timers from 1 to 180 minutes, rapid presets (25m, 45m, 50m, 90m), custom templates, Pomodoro cycles with short/long breaks, stopwatch mode, timestamp-based recovery across page reloads, and early-save actual elapsed minutes.
* **Low-Friction Habit Tracking:** Binary check-ins, quantitative habits with minimum / maximum goals, partial progress recording, custom 7-day schedules, and reversible XP calculations derived directly from logs.
* **90-Day Atlas & Visual Analytics:** 90-day challenge grid, 30-day activity signals, 14-day habit lens, Life Compass area balance, Mood Mirror reflections, and weekly consistency comparisons.
* **Gamification & Reward Wallet:** Lifetime experience points (XP), streaks, levels, achievement milestones, and a spendable reward wallet with full refund capabilities.
* **Supabase Cloud Sync & Google OAuth:** Optional cross-device cloud synchronization powered by Supabase with Row Level Security (RLS) and Compare-And-Swap (CAS) revision conflict protection. Sign in via email/password or "Continue with Google".
* **Guest / Local-First Privacy:** Works 100% offline out-of-the-box. All data is saved in local browser storage (`ninety-track-v1`). No tracking cookies, no advertising, and no analytics trackers.
* **Accessibility (WCAG 2.2 AA):** Fully keyboard navigable with modal focus traps, screen reader aria announcements, high-contrast themes (Light / Dark), and reduced-motion support. Tested across screen widths from 320px to 1440px+.

---

## Quick Start (Local Run)

AVENORY is completely static. You can run it with any local HTTP server:

```bash
# Python 3
python3 -m http.server 8000

# Visit http://localhost:8000 in your browser
```

For PWA offline service worker caching and notification testing, visit via `http://localhost:8000` or an HTTPS domain.

---

## Cloud Sync Setup (Supabase)

Cloud synchronization is optional. If you want cross-device sync between laptop and phone:

1. Create a free project on [Supabase](https://supabase.com).
2. Open the **SQL Editor** in your Supabase Dashboard and run `supabase/schema.sql` to initialize the `ninety_profiles` table, Row Level Security policies, and the `ninety_write_state` RPC function.
3. Configure `cloud-config.js` with your project URL and public publishable key:
   ```javascript
   window.NINETY_CLOUD = {
     url: 'https://<your-project-id>.supabase.co',
     anonKey: '<your-publishable-anon-key>'
   };
   ```
4. **Google OAuth (Optional):**
   * In **Authentication → Providers → Google**, enable the provider and enter your Google OAuth Client ID and Secret.
   * In **Authentication → URL Configuration**, add your deployment URL (e.g., `https://<your-site>.pages.dev/**` and `http://localhost:8000/**`) to the **Redirect URLs**.

---

## Deploy to Cloudflare Pages for Free

AVENORY deploys seamlessly to Cloudflare Pages directly from this GitHub repository:

1. In the [Cloudflare Dashboard](https://dash.cloudflare.com/), go to **Workers & Pages** → **Create application** → **Pages** → **Connect to Git**.
2. Select your repository (`AVENORY`).
3. Set the build configuration:
   * **Framework preset:** `None`
   * **Build command:** *(leave empty)*
   * **Build output directory:** `/` *(or leave blank for root directory)*
4. Click **Save and Deploy**. Cloudflare Pages will build and deploy your site in seconds over their global CDN.

---

## Automated Test Suites

The project includes 9 comprehensive regression test suites in `tests/`:

```bash
# Set up test environment
python3 -m venv .venv
source .venv/bin/activate
pip install playwright requests
playwright install chromium

# Run all test suites
for f in tests/test_*.py; do echo "=== $f ==="; python3 "$f"; done
```

### Verified Test Areas
* `test_live_supabase.py`: Live Supabase RLS, RPC, OAuth redirect & PostgREST JWT verification.
* `test_cloud_sync_and_auth.py`: UI authentication flows, OAuth callback handlers, 2-device CAS conflict detection, multi-user isolation.
* `test_focus_studio.py`: Custom 1–180m timers, presets, early elapsed time saves, session recovery, stopwatch.
* `test_habits_and_xp.py`: Binary and quantitative habits, reversible XP, wallet rewards & refunds.
* `test_exports_imports_atlas.py`: 90-day Atlas, 30-day activity, JSON backup, CSV & ICS calendar exports and imports.
* `test_responsive_wcag.py`: 320px to 1440px viewport overflow checks, modal focus trapping, WCAG 2.2 AA contrast & labels.
* `test_timer_logic.py`: Timer persistence and duplicate prevention.
* `test_audit_enhancements.py`: Modal traps, direct quantity inputs, North Star autosave.
* `test_v5.py`: Design system layout and responsive rendering.

---

## Architecture & Project Structure

```text
AVENORY/
├── index.html                 # Main application shell and SVG icon sprites
├── app.js                     # Core application logic, PWA controller, sync engine
├── cloud-config.js            # Supabase public endpoint and publishable key configuration
├── styles.css                 # Base responsive styles and utility classes
├── vowmera.css                # Visual theme styling and components
├── edition-five.css           # Edition Five scoped polish and Google OAuth styles
├── manifest.webmanifest       # PWA manifest
├── sw.js                      # Offline service worker cache controller
├── assets/                    # Application icons and vector logos
├── supabase/
│   └── schema.sql             # Supabase schema, RLS policies, and CAS RPC function
├── tests/                     # 9 automated regression test suites
└── scripts/
    └── prepare_deploy.py      # Production deployment packager
```

---

## Data Safety & Privacy Guarantee

* **Local Storage Keys:** User data is stored locally under `ninety-track-v1`. Timer state is maintained under `ninety-v3-focus-runtime` and `ninety-v3-focus-prefs`.
* **Zero Telemetry:** No third-party analytics trackers, tracking beacons, or data harvesting libraries.
* **Portable:** Complete one-click JSON backup export and import available in **Settings → Back up & take your data**. Always keep a backup before resetting browser storage or switching devices.

---

## License

MIT License. Free to use, adapt, and host for personal and non-commercial growth.

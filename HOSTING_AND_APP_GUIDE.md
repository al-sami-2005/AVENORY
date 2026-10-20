> **Edition Five:** Deploy `edition-five.css` alongside the earlier stylesheets and use the exact `vowmera-v5` site folder. Cross-device sync is not active until the owner authorizes Supabase configuration, applies schema/RLS, and tests real accounts. See `README.md` and `ANTIGRAVITY_HANDOFF.md`.

# Ninety 2.0 — step-by-step website hosting & future mobile app guide

This guide is meant for a MacBook owner who does not need to know coding. **No hosting fees or paid domain are required for the current static site.** External provider interfaces and free-tier quotas can change.

## 1. Check the website on your Mac (about 2 minutes)
1. Unzip `Ninety-V2-Complete.zip`.
2. Open the `ninety-v2` folder in Finder.
3. Open **Terminal**, type `cd ` (with a trailing space), drag the `ninety-v2` folder into Terminal, then press Return.
4. Type `python3 -m http.server 8000`, press Return.
5. Open **Chrome** or **Safari** at <http://localhost:8000>.
6. Use the daily checklist and try **Progress**, **Rewards**, **Growth**, **Focus**, **Settings**.
7. Press `Control+C` in Terminal to stop the local server.

**Data safety:** If you used an earlier Ninety website in the same browser **and at the same website origin**, your saved data will be reused. A new `localhost` URL, `pages.dev` site, or phone is a different origin, so you need to import a JSON backup through Settings. Before updates, export a backup.

## 2. Recommended: free hosting with automatic deployment via GitHub + Cloudflare Pages

1. Make a **private or public** GitHub repository for the code. Never put personal JSON backups or secrets into the repository.
2. Upload the *contents of the `ninety-v2` folder* so `index.html` is at the repository root. You can upload via GitHub's **Add file → Upload files** or use Git on the Mac. (Exclude `tests/*.png` if you don't need screenshot artifacts.)
3. Sign up / sign in at [Cloudflare Dashboard](https://dash.cloudflare.com/). Go to **Workers & Pages → Create → Pages**. Select **Connect to Git / Import a Git repository**. Wording varies.
4. Authorize the repository in Cloudflare (approve the minimum requested GitHub permissions). Choose your Ninety repo.
5. This is a plain static site: set the framework to **None** (or no framework), **no build command**, and output location to `/` (project root). If Cloudflare requires a build output folder, ask Antigravity to adjust the deployment setup rather than guessing.
6. Choose your Pages project name, deploy, and wait for a successful production deployment. Cloudflare should provide an HTTPS `https://<your-project>.pages.dev` address.
7. Test the live site on desktop and phone. On Android Chrome, use the browser **Install app / Add to Home screen** menu. On iPhone Safari, use the **Share → Add to Home Screen** action (wording can change).
8. Future code commits should deploy automatically through Git integration. Test each update, and keep JSON backups.

If you want to publish one version quickly without GitHub, Cloudflare Pages **Direct Upload** supports drag-and-drop of prebuilt static files. Note that a Direct Upload project cannot later be switched to Git integration; create a new Git-integrated Pages project if you want automatic deployments.

Free hosting covers the site only. It does **not** magically provide cross-device sync, an email/sms backend, or guaranteed closed-app notifications. No custom domain is necessary; free-tier terms may change.

**Official:** [Cloudflare Pages Git integration](https://developers.cloudflare.com/pages/configuration/git-integration/) | [Cloudflare Pages Direct Upload](https://developers.cloudflare.com/pages/get-started/direct-upload/)

## 3. Make the reminders useful *today* without a backend

1. Open the installed Ninety website → **Settings** (gear in phone header).
2. Set **Morning check-in**, **Evening reflection**, and individual habit reminder times if desired.
3. For while-open reminders, turn on browser notifications. Test the button and your browser/phone permissions; no alerts can appear if notifications are blocked. Tab throttling may delay or miss an alert.
4. For device-managed reminders after closing the site, click **Download 90-day calendar reminders**.
5. Import the `.ics` file using your chosen calendar app and turn on **event alerts / notifications**. Calendar import behavior differs across Apple, Google and other calendars; test a short reminder, check duplicates when re-importing, and avoid importing the same file repeatedly.

**Important:** The JavaScript timer and browser reminders are not guaranteed when the page is closed. A service worker alone cannot schedule alarms in the future. Web Push needs a push-sending backend, subscriptions, permission, and typically HTTPS. Apple supports Web Push on compatible Safari environments and on iOS Home Screen web apps with requirements.

**Official:** [Apple Web Push overview](https://developer.apple.com/documentation/usernotifications/sending-web-push-notifications-in-web-apps-and-browsers) | [MDN Notifications API](https://developer.mozilla.org/en-US/docs/Web/API/Notifications_API)

## 4. Start work inside Google Antigravity

1. Install **Google Antigravity IDE** for your Mac from [Google's setup instructions](https://www.antigravity.google/docs/getting-started?tab=ide), if you have not already.
2. Open Antigravity IDE, **Open Folder** → select the unzipped `ninety-v2` folder (not the ZIP).
3. Read `README.md` and `AGENTS.md`. Antigravity can discover `AGENTS.md` instructions from the project root.
4. Open the Agent panel and **copy the full text of `ANTIGRAVITY_PROMPT.txt`** as your first instruction.
5. Ask it to audit/test first, then implement only fixes you approve. Review changed files, run locally, and keep a fresh JSON backup before redeploying.
6. Use its browser testing, terminal, plan, and walkthrough where supported. **Never paste passwords, private user backups or tokens into public repositories**; grant GitHub or Cloudflare access through their own authorization screens only.

**Official:** [Antigravity getting started](https://www.antigravity.google/docs/getting-started?tab=ide) | [Agent rules](https://www.antigravity.google/docs/rules-workflows?tab=ide)

## 5. Future native Android app — after website is stable

A recommended path for this existing HTML/CSS/JS codebase is **Capacitor**: it can package a web app into native Android/iOS shells rather than forcing an immediate rewrite. The currently shipped ZIP is **not an Android APK or iOS app build**.

Ask Antigravity to perform these steps in a **separate feature branch**:

- Add npm/package files and Capacitor tooling, generating a web build folder from the existing static app.
- Add Android support, verify Android Studio and emulator/phone tooling, create a signed *test* APK as appropriate, and check offline loading.
- Integrate `@capacitor/local-notifications` to schedule morning/evening/per-habit notifications **locally on the phone**, without a server. Handle Android 13+ notification permission, recent Android exact-alarm limits, notification channels, timezone and daylight-saving changes, changed reminders, canceled goals, and device reboot behavior. Test notification delivery when the app is swiped away, closed, battery restricted, or restarted. OS behavior can still prevent guaranteed delivery.
- Safely migrate/import existing progress from JSON, because an installed native app typically does not share the website's browser `localStorage` directly.
- Only after Android proves reliable, plan iOS packaging in Xcode and notification behavior. Publishing to official app stores can involve account fees; ask before spending money.

**Official:** [Capacitor Local Notifications](https://next.capacitorjs.com/docs/apis/local-notifications).

## 6. Later premium-grade features (opt-in)

- Versioned goal-history snapshots, so adjusting today's target does not silently rewrite last month's analytics.
- Custom calendar heatmap ranges and weekly review story cards (best habit, recovery trends, actual project impact).
- Offline-first opt-in sync (encrypted where feasible), device change recovery, multi-device conflict handling; this requires backend/security design and may involve ongoing infrastructure. Do not call it free before verifying quotas.
- Reliable native notifications with individual timezone-aware rescheduling, actionable notification buttons, and a bedtime quiet window.
- Android app timer widgets, accessibility audit (WCAG 2.2 AA), automated tests on actual devices, localization (Bangla/English), privacy policy and data export/deletion controls.

**Avoid overengineering too early:** Keep the zero-cost website easy to use and stable before building complex server and app infrastructure.

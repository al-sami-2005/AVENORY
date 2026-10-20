# VOWMERA Edition Five — guidance for Antigravity and developer agents

## Non-negotiable safety and integrity

1. Preserve the original local key `ninety-track-v1`, all existing user logs, XP, redeemed rewards, projects, focus sessions, notes and settings. Do not wipe or overwrite real cloud profiles to populate a demo.
2. The old private `ninety-v3-user-{uid}` cache, `ninety-v3-meta-{uid}` and Supabase `ninety_profiles` JSON schema are intentional compatibility layers; do not casually rename them.
3. Always show an explicit **export backup** option before migration, import, reset, resolving sync conflicts or changing hosting origin.
4. Never commit or publish Supabase service-role/secret keys, database password, refresh tokens, privileged credentials or user data. A public publishable key is allowed in `cloud-config.js` after owner approval.
5. Keep row-level security and the optimistic revision sync function intact; perform live tests with two distinct users before launch.
6. Do not describe closed-browser web notifications as fully reliable; prioritize proper native scheduling when building the mobile app.
7. This is an original UX inspired by product principles of Seed, Finch, Forest, TickTick etc., not an attempt to duplicate their artwork, branding or copyrighted text.
8. Use discrete labels for private/sexual behavior goals and non-shaming language. No fake claims of clinical treatment or AI predictions.
9. New UI and functionality must pass keyboard/mobile interaction tests (320, 360, 390, 430, 768, 1024, 1440px) and reduced-motion checks.
10. Do not add paid backend, advertising, data sales, community feed or analytics trackers without explicit owner approval.

## Architecture

Vanilla JS PWA. `app.js` is an immediately invoked closure. The entire profile serializes to JSON; `sanitizeState()` provides schema-compatible defaults. `vowmera.css` overrides the existing V3 `styles.css`, and `edition-five.css` supplies further scoped polish, preserving old selectors and behavior. Do not accidentally remove V3 features while refining appearance. The server supplies only static HTML/CSS/JS files; there is **no Node/Next.js backend**.

## Next development tasks

A. Audit the Edition Five custom focus-time controls, presets, partial-minute save, new charts, next moves and all focus session state transitions, edge cases at midnight and timezone changes, DST, duplicate XP avoidance, and Quantitative Habit `max` logging semantics. Treat goals as user-defined targets, not health guidance.
B. Audit v4 quote favorites, North Star, parking lot, breath guide lifecycle, seven-day goal, popup keyboard behavior and legacy data import paths.
C. Run a real WCAG 2.2 AA test (keyboard order, aria-live cadence, focus trapping in modals, contrast, screen readers) and improve any failures.
D. Validate live Supabase auth flows after the user configures it; prove account isolation with two users, examine refresh token storage risks and CORS. Whole-profile sync may require migration to row-level syncing at scale.
E. Deploy to free static hosting; confirm all files served securely and service-worker update behavior.
F. Convert to Android with Capacitor, add native scheduled notifications and plan iOS separately; do real device testing.

**Don't claim every part is perfect; report tests and limitations precisely.**

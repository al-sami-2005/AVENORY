# VOWMERA Edition Five — test notes

Date: 2026-10-20. The following are **browser-level smoke checks**, not an assertion of error-free production software.

## Completed

- `node --check app.js` syntax passes.
- Browser smoke tests passed individually for viewport widths **320, 360, 390, 430, 768, 1024, 1440 CSS pixels** without horizontal overflow on the exercised Today, Habits, and Focus pages.
- Tested changing daily XP and undoing its change; selecting a 14-day habit lens; pressing next-quote; opening the 30-day map; setting custom 37-minute focus interval; saving and applying a named preset; starting timer.
- Deterministic browser-document persistence test (`tests/test_timer_logic.py`) passes: 2-minute focus started, 1-minute partial time logged and persisted; previously expired 2-minute timer completed on fresh document; repeated reload did **not** double-log the completed session.
- Existing edition 4 smoke checks previously covered North Star, private Reset, all-features menu, progress atlas, project settings, parking lot, focus goal, rewards/settings navigation (these flows were retained; new release requires a full regression run before public launch).
- CSS includes focus-visible styles, reduced-motion support, label/aria text and mobile nav controls. Full audit not completed.

## Still required before calling it production-ready

- Unit and integration tests for every habit edge case, especially maximum-value check-in, changes of a habit's type/target while historic data exists, date and timezone changes, duplicate IDs, export/import conflict behavior, and redemption semantics.
- Real Supabase auth, row-level-security, multi-device conflict and synchronization tests against the user's project (not connected yet).
- Safari and iOS/Android physical device testing, VoiceOver/TalkBack/keyboard/switch device, color contrast audit (WCAG 2.2), low-end device performance and network throttling.
- Closed-browser notification guarantees require the native app; web PWA alone cannot supply them.
- Security, privacy, retention, recovery, branding/trademark and accessibility reviews.

## Testing commands

```bash
python tests/test_v5.py                 # all width UI smoke checks (may take time)
python tests/test_timer_logic.py       # deterministic fresh-document timer restoration
node --check app.js
```

Browser tests simulate local guest mode; they do NOT prove live cloud functionality. See `ANTIGRAVITY_HANDOFF.md` for release gating.

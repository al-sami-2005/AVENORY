# VOWMERA product research & differentiation · October 2026

Research covers publicly described features, official help centers and product pages, not paid accounts, reverse engineering, or unverifiable claims of complete competitor coverage.

| Reference | Verified pattern | VOWMERA response |
|---|---|---|
| TickTick | Pomodoro/stopwatch with task linkage, focus session analytics, shortcuts, interval customization (https://help.ticktick.com/articles/7055782010496745472) | Custom 1–180-minute timer with task/project linkage, templates, timestamp persistence, log-early action, minute history. Real-time *cross-device running* timer sync remains future work. |
| Habitify | Flexible weekday/interval scheduling, quantitative goals, time-of-day reminders and habit settings (https://intercom.help/habitify-app/en/articles/11203157-add-a-new-habit-on-website-desktop-app) | Custom day schedules, min/max/binary target types, per-habit progress analysis. Interval/monthly recurrence are **not implemented**; plan only if users need them. |
| Structured | Single visual day timeline and fast daily planning across devices (https://structured.app/) | VOWMERA presents next three actions first and minimizes navigation. A full drag-and-drop timeline is not implemented; investigate only after check-in behavior is fast and correct. |
| Finch | Rewards tied to small daily goals, personalized encouragement, self-care areas (https://help.finchcare.com/hc/en-us/articles/37780000231309-Exploring-the-Finch-Home-Page) | Original written encouragement, reversible points, personal rewards, supportive reset space; no pet cloning. |
| one sec | Optional breathing/pause interventions before distraction-prone apps (https://tutorials.one-sec.app/en/articles/3310978) | Manual private Reset; a web page cannot intercept other apps or automatically block them. This would require platform-native capabilities and explicit user consent. |
| WCAG 2.2 | Focus visibility and adequately sized target guidance (https://www.w3.org/WAI/standards-guidelines/wcag/new-in-22/) | Keyboard labels, `:focus-visible`, larger critical tap targets, reduced-motion support; certification and assistive-technology test still required. |

## Product idea: the personal progress field

VOWMERA does **not** ask users to manage a fictional character. Instead, the dashboard portrays each individual's *evidence of becoming*. Direct actions, meaningful reflection, reversible XP and 90-day history constitute the core. Tiny motion is used for status and feedback, not to distract from recording honest data. A bad day does not reset the entire account or punish the user.

### Original/combined features introduced

1. **Next three moves**: action order uses already completed data and partial progress; exact actionable goals remain clear.
2. **14-day Habit Lens**: each habit's scheduled history is displayed separately from its full-day overall chart, with explicit denominator and insufficient-data label.
3. **Life Compass**: personal categories show scheduled completion rather than an opaque motivational score.
4. **Mood Mirror**: observational check-in patterns, not AI-generated claims or a diagnosis.
5. **Focus templates**: personalized timer presets saved on-device, with quick loading and meaningful finish-early tracking.
6. **Local-first care**: no behavioral advertising, data brokerage, paywall, external media feeds or third-party motivational quotes.

### Not shipped yet / roadmap priorities

- P0: real Supabase registration, recovery, explicit multi-device conflict handling, per-user RLS and unauthorized-access tests, verified migration & zero-data-loss recovery.
- P0: automated test matrix for min/max logging, scheduling, date changes, edit/delete/report consistency, XP reversibility, focus-session restoration, redemption integrity, CSV/JSON safety, dark/light, keyboard focus order.
- P1: move timer preferences and named focus templates into per-account synchronized settings; move whole-profile JSON syncing toward safer record-level replication.
- P1: genuine Android native scheduled reminders with user-controlled quiet hours, snooze, permission diagnostics, rescheduling after boot and timezone changes, and testing on locked/battery-optimized devices.
- P1: password reset, account deletion and export, clear consent and privacy transparency, accessible reduced-motion toggle, in-product help.
- P2: adaptable weekly routines, human-friendly time planning, optional cross-platform widgets; avoid building an overwhelming dashboard that damages quick check-ins.

## Engineering constraints

No external image assets or charts that require paid services. Existing chart graphics should remain DOM/SVG/CSS-first. In sparse data, use “not enough history,” never invented trend predictions. Always allow edited habits and projects to preserve safe history/migration. Avoid clinical language or unearned moral judgments in recovery habit feedback.

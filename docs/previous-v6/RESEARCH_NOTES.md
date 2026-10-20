# Design research decisions (2026-10-20)

- **Daylio**: ultra-low-friction mood/activity entry and descriptive correlations (<https://daylio.net/>). AVENORY keeps three easy mood states with clear journal autosave; no unsupported psychological inference.
- **Finch**: gentle nonpunitive encouragement, rewards and focus/breathing tool integration (<https://finchcare.com/about-finch>). AVENORY introduces 'a blank checkbox is information' and contextual encouragement rather than shame or a cloned virtual pet.
- **Streaks**: flexible weekdays and at-a-glance task completion (<https://streaksapp.com/>). AVENORY provides accessible clickable weekly timeline tiles and habit schedules.
- **TickTick**: Pomodoro/stopwatch, task-linked sessions and editable elapsed time (<https://help.ticktick.com/articles/7055782010496745472>). AVENORY preserves the 1–180 min timer and logs completed minutes only.

**Novel implementation choices, not copies:** A living editorial quote with context-specific categories and decorative progress orbits; discrete check-in micro-affirmation; original brand arch emblem; zero video/WebGL dependencies. Quotes rotate based on elapsed time blocks but do not reflow whole page, so typing is preserved.

Trade-off: stronger visual hierarchy, motion restrained by `prefers-reduced-motion`; not all user preferences for illustration density are suited to every screen width. Avoid fake personalization claims or data visualizations using synthetic data.

# Product research — AVENORY V7

## Design and behavioral principles

- A **just-in-time adaptive support** model suggests helpful messages should match a person’s current context and state, not repeat a generic quote regardless of their experience. AVENORY uses local time of day, check-in mood and today's habit completion to choose message families; specialized writing is delivered alongside focus, habits, projects, reward celebration, historical charts and the private reset space. The app makes no clinical efficacy claims. Research background: Nahum-Shani et al., *Just-in-Time Adaptive Interventions (JITAIs) in Mobile Health*, Annals of Behavioral Medicine (2017), https://academic.oup.com/abm/article/52/6/446/4733473.
- **Typography:** Fraunces provides recognizable warm editorial lettering while Plus Jakarta Sans keeps controls legible. Two roles are more coherent than applying a decorative headline font to all controls. Reference pairing research: https://thefontpair.com/pairings/manrope-and-fraunces (general principle of display serif + UI sans; AVENORY keeps Jakarta Sans).
- **Distinctive motion at low cost:** transition only an updated quote block every nine minutes, use CSS for orbit/ink motion, and disable transitions when reduced-motion is requested. No background video, autoplay sound, third-party AI calls, or heavy runtime frameworks.
- **Non-punitive progress:** measured achievements, visible reversible XP, editable habits, soft recovery language, a real rest space, and focus sessions that log actual elapsed minutes.
- **Dense with intent, not clutter:** the homepage uses a two-plate print-style quote spread with editorial marginalia and an actionable next-step card; feature pages end with a contextual field note rather than repeated generic slogans.
- **Brand system:** the asymmetric arch-letter 'A' icon and matching line-symbol family (calm, growth, focus, reward) are authored as editable SVG assets. The maker's mark is presented as a tactile seal, with a contact mailto action.

## What does not rely on AI

All motivational copy is authored offline and selected deterministically from local state. It is not generated on demand, does not infer mental-health diagnoses, and does not require cloud calls. A quote changes through the day and is saved only if the user chooses its heart control.

## Research/release limitations

The supplied browser tests and screenshots do not prove real database writes, two-device race handling, or production accessibility. Verify on the hosted domain before announcing a public launch. Trademark/domain verification for 'AVENORY' is still needed before commercial use.

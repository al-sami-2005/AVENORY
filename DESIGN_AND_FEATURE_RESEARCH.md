# Research-informed design notes

Reviewed public product listings and docs on 20 October 2026. This is not an installation-level audit of each proprietary product; avoid claiming the full apps were reverse-engineered.

| Reference | What stood out in public documentation | VOWMERA interpretation | Not copied / not yet built |
|---|---|---|---|
| Seed: Gamify No Nut Quit Porn | Evolvable visual orb, streaks and levels, a craving/urge tool, guided breathwork, motivational widget and blocking features | Original concentric progress-portal, no-shame Sanctuary, rapid breathing reset, 90-day map | We did **not** copy assets/3D orb, hypnosis tapes, blocking service, AI coach or community |
| Finch | Low-friction self care, positive reinforcement, reward loop, microgoals, gentle emotion support | Light daily check-ins, customizable XP, tiny wins, mood/reflection and encouraging language | No virtual pet or borrowed narrative assets |
| TickTick | Focus and tasks tied together, calendar views, comparative statistics | Focus-to-project and habit linkage, activity charts, tasks and scheduled habits | No TickTick UI reuse |
| Forest | Visual progress rewards from staying focused and quick focus timer | Focus momentum/achievements, session recap and emotional visual progression | No virtual trees or paid nature sounds |

## User journey & visual language

**Brand working title:** VOWMERA = `vow` (a promise) + `era` (a new chapter), chosen as an original coined identity. Preliminary web search is not trademark clearance. Legal/domicile-specific availability must be checked before public or commercial use.

**Signature motifs:** deliberate editorial type, atmospheric deep-navy canvas, a lime kinetic portal that reflects *actual* completion, thin constellation marks for 90 days, three progression chapters, poetic rather than artificial-sounding quotes, serif emphasis used with restraint. No stock imagery, generic AI-looking gradient dashboard or artificially fabricated charts.

**Information hierarchy:** Every feature available on desktop sidebar and in phone's main 5-tab navigator plus all-features launcher; Today and Rituals are primary; Sanctuary available in one tap. Extra details are progressive disclosure rather than forced daily inputs.

**Data design:** All percentages are derived from logged entries; trend deltas measured in percentage points and contextualized when samples are few. `max` habit earns only after a recorded value. 90-day squares denote real past days and disable upcoming dates. Quote favorites and focus parked thoughts are stored in profile for *future* cloud syncing.

**Caution:** Avoid rewarding shame around private behavior; private goals are a personal choice and can be changed. Avoid implying correlation in weekday averages means a psychological cause. Accessibility should trump animation.

## Research sources

- Seed Google Play: https://play.google.com/store/apps/details?id=com.mindgarden.seed
- Seed iOS: https://apps.apple.com/us/app/seed-quit-temptation-urges/id6636516894
- Finch approach: https://help.finchcare.com/hc/en-us/articles/37935669335309-Our-Approach-to-Self-Care
- Finch features: https://finchcare.com/about-finch
- TickTick: https://ticktick.com/features
- Forest: https://www.forestapp.cc/

This release is independently implemented and not affiliated with these companies.

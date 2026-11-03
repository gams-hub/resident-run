# Resident Run

A gamified Pomodoro for FILTERS prep. You're a junior doctor on a night shift:

- **Each focus block = one patient.** Finish the block, then pass a recall "diagnosis" (brain dump + self-rating + flashcards).
- **Exams are bosses.** Study hours chip away at their HP; your real quiz score defeats them.
- **Stakes:** daily streak (with a weekly shield, Sundays and 1 rest day/week excused), HP that drops when you skip days or abandon a patient, XP penalty for leaving the tab.
- **Hooks:** 2-minute "scrub-in" bonus, XP ranks (Med Student → Attending), random loot chests, break menu.
- **Reward Vault:** real-life prizes (VPN, Apple TV box, …) locked behind hours AND score. Editable in-app.
- **Morgue (flashcards):** switched off (`MORGUE = false` in index.html).

Open `index.html` in a browser (or host on GitHub Pages). Data is stored in the browser — use *Ward → Settings → Download backup*.
The original checklist planner is kept as `planner.html`.

## Editing via Claude
Quizzes (bosses), rewards, rotations and extra flashcards live in `data.json`. Ask Claude to change them
("add the Renal quiz on 19 Dec", "I'm on Cardiology until 10 Jan"); the app merges the file on load and keeps your XP, hours and scores.
Needs to be served over http(s), e.g. GitHub Pages; when opened as a plain file it just uses saved data.

## Design
Apple Fitness-style: true black, concentric daily-target rings (one per ward), rounded system type, grouped lists,
glass tab bar, spring animations, Wallet-style reward passes and Deutsche Bahn-style Fahrkarten for German stations.
No emoji in the interface; icons are drawn SVG.

# AutomateFlow — Sender Account Sending Behavior (Concept Doc)

**Status:** Concept locked, feature not yet built. This document is the source of truth for sending-behavior rules — any future spec (Campaign Canvas, Sender Account management, or a Sending Engine) must reference this rather than re-deriving these numbers.

**Why this exists:** cold email deliverability depends on not looking like a bot. Every rule below exists to make outbound sending pattern resemble a human, not a script — this is the reasoning, not just the numbers, so future devs don't "simplify" this away.

---

## 1. Per-account daily cap

- Each sender account has a **base daily cap of 50 emails/day**.
- Actual daily send count is **jittered ±5-10%** around that base, re-randomized each day — not a fixed 50, and not a fixed percentage every day.
  - Example across a week: Day 1 → 45, Day 2 → 44, Day 3 → 47, Day 4 → 52 (if jitter allows slight upside), etc.
- Jitter must be recalculated fresh per account per day — the same account should not send the exact same count two days in a row unless coincidence.

## 2. Multi-account pooling for volume

- A single campaign may need to send far more than one account's daily cap allows (e.g. 1,000 leads).
- The campaign draws from a **pool of multiple sender accounts**, each independently respecting its own daily cap + jitter (Section 1).
- Distribution across accounts in the pool should not be a naive even split — treat each account as its own independent daily budget, and campaign-level sends draw from whichever accounts still have budget remaining that day.

## 3. Human-like send timing (within a day)

- Emails from one account on one day are **never sent in a burst** (e.g. not 50 emails in one second).
- Sends are spaced with **randomized gaps of roughly 10–30 minutes** between each email from the same account.
- A day's sending has an implied human start time (example referenced: ~10:00 AM) — the first email of the day anchors near that time, with subsequent sends trailing through the day at the randomized gap.

## 4. Business-hours restriction — flagged, not yet decided for v1

- Long-term intent: sending should be restricted to business hours only (avoid 2 AM sends, which look automated).
- **Open decision, not yet locked:** whether this ships in the first working version of Sender Accounts or is deferred. Flag explicitly in any spec that implements this feature — don't silently assume either way.

## 5. Explicitly not decided yet (do not build against assumptions here)

- Whether Sender Account is a **campaign-level pooled setting** or has **per-node override** capability (e.g. different sender per touch in a sequence) — see architectural pattern discussion, tracked separately.
- Timezone handling for business hours (lead's timezone vs sender's vs a fixed campaign timezone) — not yet discussed.
- What happens when all accounts in a pool exhaust their daily cap before all leads are contacted (queue to next day? warn the user? no rule yet).
- Account health/reputation monitoring (bounce rate, spam complaints affecting cap) — not yet discussed, likely out of scope for an initial version.

---

## Referenced by

Any future spec for: Sender Account management UI, the sending engine/scheduler, or Campaign Canvas changes that touch sender assignment, must read this file first and flag any deviation from it explicitly rather than inventing new numbers.

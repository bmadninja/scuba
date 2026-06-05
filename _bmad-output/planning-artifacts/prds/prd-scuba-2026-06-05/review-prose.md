---
title: Prose Review — Affiliate Link Integrity PRD
reviewer: editorial-review-prose skill
reviewed: 2026-06-05
source: prd.md
---

# Prose Review: Affiliate Link Integrity PRD

Overall verdict: The PRD is well-structured and mostly clear, but six issues impede precise comprehension — a pronoun–antecedent disagreement, a vague cross-reference, two undefined acronyms, an orphaned assumption that contradicts the Open Questions table, and an insider reference that will confuse anyone outside the immediate team.

---

## Findings

| Original Text | Revised Text | Changes |
|---|---|---|
| "A user clicking 'Yenkoranu Homestay' lands on a Booking.com keyword search, not the hotel's own page. They may find the right result, or they may not." (Problem Statement, item 1) | "A user clicking 'Yenkoranu Homestay' lands on a Booking.com keyword search, not the hotel's own page. That user may find the right result, or may not." | "They" is grammatically attached to singular "A user" but reads as plural. Replace with "That user" to agree with the antecedent and eliminate ambiguity. |
| "The site's mission is to be the most useful scuba research platform. Revenue from affiliate links covers hosting costs. Both goals depend on the same fix…" (Problem Statement, final paragraph) | "The site's mission is to be the most useful scuba research platform, and affiliate revenue covers hosting costs. Both goals depend on the same fix…" | "Both goals" requires two explicit goals to refer back to; the original sentences state a mission and a revenue fact, not two numbered goals. Merging them into one sentence with a conjunction makes the two-part referent unambiguous. |
| "AID \`2831408\`" (Booking.com row, Active Affiliate Programmes table) and "PID \`645\`" (DiveBooker row) — repeated in FR-H2 and FR-L2 | "AID \`2831408\` (Awin Advertiser ID)" and "PID \`645\` (DiveBooker Publisher ID)" on first use | Neither acronym is defined. A developer unfamiliar with Awin or DiveBooker terminology will not know what AID or PID stand for. Expand on first use; subsequent uses can remain abbreviated. |
| "**FR-G3:** [ASSUMPTION] Gear items without an Amazon ASIN that can be verified are left as-is (no change to current 0 items without partners). Confirm." (Gear section) | Move to the Open Questions table as a new row: \| OQ-5 \| FR-G3: Gear items without a verifiable Amazon ASIN — leave as-is or remove? \| Josie \| Open \| — and remove the inline [ASSUMPTION] from FR-G3, or mark it Resolved if already decided. | FR-G3 is flagged as an unresolved assumption requiring confirmation, but it does not appear in the Open Questions table. This inconsistency obscures whether the question is open or resolved. Either resolve and remove the "Confirm" tag, or surface it in Open Questions so it gets an owner and status. |
| "Travelpayouts AID \`728836\` is live in Notion." (Flights section) | "Travelpayouts AID \`728836\` is confirmed and stored in the project's Notion workspace." | "Live in Notion" is an insider shorthand. A reader outside the team won't know whether "live" means approved, active, or merely documented. Spell out the meaning. |

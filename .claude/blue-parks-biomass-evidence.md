# Blue Parks fish-biomass evidence — curation record & MCI reassessment needs

Prepared 2026-07-08. Extends the Torre Guaceto template (fish biomass as the "protection works" signal, decoupled from heat-driven coral) to the other Blue Park sites on scubaseason.fun.

Every figure below was independently verified against its published source before wiring. Where a widely quoted number turned out to be NGO monitoring rather than peer-reviewed, it was rejected.

## What was wired (real, cited, verified)

Each study is now in `sources.json` (sourceType `peer-reviewed-paper`), tied to the new `reef-biomass-recovery` methodology claim in `methodologies.json`, and referenced from the site's `reef-pressure.json` record via `manualReefStateBasis` + `manualReefStateSourceIds`.

Label policy (hybrid, per Josie 2026-07-08): set the state to **Improving** only where there is a peer-reviewed inside-vs-outside or before-vs-after contrast **and** the coral chart is not currently falling. Everywhere else the honest coral-driven engine state stays, and the cited biomass sentence shows as the verdict basis.

| Site | Finding (as published) | Citation | State shown |
|---|---|---|---|
| Wolf (Galápagos) | 17.5 t/ha total, 12.4 t/ha shark — world's highest | Salinas-de-León et al. 2016, PeerJ e1911 | Declining* |
| Darwin (Galápagos) | 17.5 t/ha total, 12.4 t/ha shark | Salinas-de-León et al. 2016, PeerJ e1911 | Declining* |
| Channel Islands | targeted biomass +3.7× faster inside (0.078 vs 0.021 t/ha/yr) | Caselle et al. 2015, Sci Rep 14102 | **Improving** |
| Malpelo | ~879 g/m², among highest in E. Pacific, no-take | Quimbayo et al. 2016, Env Biol Fish 100 | Declining* |
| Jardines de la Reina | mutton snapper ~8× denser inside (reef crest) | Pina-Amargós et al. 2014, PeerJ e274 | Stable |
| Exuma Cays | total fish biomass ~7× higher inside | Lamb & Johnson 2010, MEPS 408 | Declining* |
| Cocos | 7.8 t/ha, ~40% apex predators | Friedlander et al. 2012, Rev Biol Trop 60 | Stable |
| Tubbataha | highest among Philippine reefs; fished areas a fraction | Muallil et al. 2019, Ocean Coast Mgmt 179 | Stable |
| Providencia | biomass/density higher inside than outside | Prato-Valderrama et al. 2024, Bol Cient CIOH 43 | Stable |
| Abrolhos (new record) | ~148 vs ~8 g/m² inside vs fished (~18×) | Bruce et al. 2012, PLOS ONE e36687 | **Improving** |
| Chumbe (new record) | ~886 vs ~285 kg/ha inside vs fished | McClanahan et al. 2009, Aquat Conserv 19 | **Improving** |
| Kisite / Diani (new record) | 682–1,354 vs 260–457 kg/ha inside vs fished | McClanahan et al. 2006, Aquat Conserv 16 | Not surveyed† |
| Aldabra (new record) | ~4.8 t/ha, among highest in Seychelles | Koester et al. 2023, Front Mar Sci 10 | Not surveyed† |

\* Coral is under active heat stress / falling (alert-2 or cover below its history), so the coral-driven "Declining" state stands; the biomass sentence explains that the decline is coral, not the fish.
† Standing-stock benchmark or boundary caveat (Diani proper sits outside the no-take park); the cited biomass sentence shows under the honest "Not surveyed" state.

Four sites (Abrolhos, Chumbe, Kisite/Diani, Aldabra) had **no** reef-pressure record; minimal base records were created using only verifiable fields — Blue Park no-take status (`mpaStatusSource: "manual"`), measured Global Fishing Watch effort, and factual visitor notes.

## Rejected — did not meet the peer-reviewed bar

- **Raja Ampat / Misool**: the famous "250% biomass / 25× sharks" figures are **Misool Foundation NGO monitoring**, not peer-reviewed. The peer-reviewed Purwanto et al. 2021 (Cons Sci Pract e393) abstract explicitly calls reef fish biomass trends "more variable." Not wired. Has a record, so it is a prime candidate for a standardized KPI series.
- **Socorro / Revillagigedo**: real papers exist (Fourriére 2019; McKinley 2025) but no single exact biomass figure retrievable without institutional access. Not wired.
- **Apo Reef Natural Park**: only gray-literature standing-stock surveys. (Note: the famous Russ/Alcala 3× biomass work is Apo *Island*, a different site — not applicable.)
- **Coron / Siete Pecados**: only a Reef Check monitoring report.
- **Gorgona**: the one published figure (Quimbayo et al. 2025) shows it as the *lowest* Colombian Pacific site with no significant protection effect — no "protection works" signal.

## Sites that would most benefit from MCI's Enduring Blue Parks reassessment KPIs

Delivered via the MOU (draft at `.claude/mci-mou-draft.md`). MCI's standardized reassessment series (biomass, biodiversity, ecotourism) would fill exactly the gaps above.

**Biomass KPI — highest value (currently no usable peer-reviewed biomass, or a contested/one-off number):**
1. Raja Ampat / Misool — replace the NGO 250% figure with a standardized, citable series (has a record; ready to wire the moment real data lands)
2. Socorro / Revillagigedo — turn the known shark hotspot into a quotable biomass KPI
3. Apo Reef Natural Park — needs any standardized biomass survey (distinct from Apo Island)
4. Coron / Siete Pecados — upgrade Reef Check monitoring to a KPI series
5. Gorgona, Isabela, Fernandina — no site-specific protection-works biomass on file

**Biomass KPI — upgrade a standing benchmark into a true inside-vs-outside or time series:** Wolf, Darwin, Malpelo, Cocos, Aldabra (world-class biomass, but our evidence is a snapshot, not a measured recovery). A before/after or inside/outside KPI would let these read "Improving" on biomass grounds even while coral is heat-stressed.

**Biomass KPI — refresh / reconcile:** Tubbataha (our sources disagree on the absolute number: 106.5 vs 55.1 mt/km²; a standardized value would settle it) and Providencia (currently rests on a regional naval-oceanography bulletin).

**Biodiversity KPI:** any Blue Park lacking a species-richness or assemblage trend — same list as above, plus the coral-declining reserves where a fish-biodiversity trend would complement the biomass story.

**Ecotourism KPI:** valuable across **all** Blue Parks — we currently hold no ecotourism metric, and this is the "blue economy / local livelihoods" evidence the MOU and the Blue Parks standard are built around (and the strongest complement to the Torre Guaceto case study).

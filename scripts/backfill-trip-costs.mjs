#!/usr/bin/env node
/**
 * Phase 8 — Trip-cost data backfill.
 *
 * Emits a TripCostEstimate per location using regional templates.
 * Editorial ranges, not live prices. Each record cites the
 * trip-cost-editorial-2026 methodology note for the limitations.
 *
 * Templates encode:
 *   - typical round-trip economy flight ranges from 5 hubs
 *   - lodging tier ranges (budget / mid / upscale / luxury / liveaboard)
 *   - per-day dive package range
 *   - local transfers + park fees
 *
 * Per-location nudges can be applied later by editing the JSON.
 *
 * Idempotent — preserves existing hand-edited records on disk.
 */

import fs from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(new URL("..", import.meta.url).pathname);
const TC_PATH = path.join(ROOT, "src/data/trip-costs.json");
const LOC_PATH = path.join(ROOT, "src/data/locations.json");

const r = (min, max) => ({ min, max });

// Template flights below were originally written as [min, max] arrays;
// rewriteFlights() runs on each template at load time so we keep the
// compact source-code shorthand without breaking the typed output.
function rewriteRanges(obj) {
  if (!obj) return obj;
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    out[k] = Array.isArray(v) ? { min: v[0], max: v[1] } : v;
  }
  return out;
}

// Regional templates. Each template defines:
//   flights:      hub → [min, max] round-trip economy
//   lodging:      tier → [min, max] per night USD double-occ
//   diveDay:      [min, max] per day, 2-boat package
//   transfers:    [min, max] trip total per traveller
//   parkFees:     USD per traveller (one-time, omit if none)
//   notes:        plain-English context
const T = {
  // ---- INDONESIA / CORAL TRIANGLE (cheap on the ground, varied flights) ----
  CT_BUDGET: {
    flights:   { "us-west":[1100,1900],"us-east":[1400,2200],"europe":[1000,1800],"asia":[300,700],"oceania":[700,1300] },
    lodging:   { budget:r(35,80), mid:r(90,180), upscale:r(220,400), luxury:r(500,1100) },
    diveDay:   r(95,160), transfers:r(40,150), notes: "Local prices are low; the dollar cost is overwhelmingly the long-haul flight." },
  CT_REMOTE: {  // Raja Ampat, Misool, Komodo
    flights:   { "us-west":[1200,2200],"us-east":[1600,2400],"europe":[1100,1900],"asia":[400,900],"oceania":[700,1300] },
    lodging:   { mid:r(180,360), upscale:r(400,700), luxury:r(900,2200), liveaboard:r(450,950) },
    diveDay:   r(140,220), transfers:r(150,500), parkFees: 75,
    notes: "Remote eco-lodges and liveaboards drive cost. Park entry fees are real money. Allow 2 travel days each way." },
  PHILIPPINES_BUDGET: {
    flights:   { "us-west":[900,1700],"us-east":[1200,2100],"europe":[900,1700],"asia":[200,600],"oceania":[500,1100] },
    lodging:   { budget:r(25,60), mid:r(70,150), upscale:r(180,350), luxury:r(400,900) },
    diveDay:   r(70,130), transfers:r(50,180),
    notes: "One of the cheapest tropical dive destinations once you arrive. Internal flights are short and cheap." },
  MALAYSIA_BUDGET: {
    flights:   { "us-west":[1000,1800],"us-east":[1300,2200],"europe":[800,1600],"asia":[200,600],"oceania":[500,1000] },
    lodging:   { budget:r(30,70), mid:r(80,170), upscale:r(200,380), luxury:r(450,900) },
    diveDay:   r(100,160), transfers:r(60,200),
    notes: "Sipadan permits are limited and add bureaucracy; otherwise cheap and easy logistics." },

  // ---- AUSTRALIA / GBR ----
  GBR_PREMIUM: {
    flights:   { "us-west":[1100,1900],"us-east":[1400,2200],"europe":[1300,2300],"asia":[600,1200],"oceania":[150,500] },
    lodging:   { mid:r(150,260), upscale:r(280,500), luxury:r(600,1300), liveaboard:r(550,1100) },
    diveDay:   r(180,280), transfers:r(60,200),
    notes: "Cairns is the gateway; outer-reef trips and liveaboards are the headline. Everything in AUD." },
  NINGALOO: {
    flights:   { "us-west":[1300,2100],"us-east":[1600,2400],"europe":[1500,2400],"asia":[800,1500],"oceania":[400,900] },
    lodging:   { mid:r(130,240), upscale:r(280,500), luxury:r(550,1100) },
    diveDay:   r(220,360), transfers:r(120,350),
    notes: "Whale shark snorkel charters drive the season; Exmouth is remote and pricier than the GBR side." },
  NSW_TEMPERATE: {
    flights:   { "us-west":[1100,1900],"us-east":[1400,2200],"europe":[1300,2300],"asia":[600,1200],"oceania":[150,400] },
    lodging:   { budget:r(80,160), mid:r(150,280), upscale:r(300,550), luxury:r(600,1100) },
    diveDay:   r(150,240), transfers:r(40,140),
    notes: "Easy logistics from Sydney/Byron Bay; subtropical with seasonal grey nurse sharks." },

  // ---- HAWAII / KONA / US PACIFIC ----
  HAWAII_PREMIUM: {
    flights:   { "us-west":[400,800],"us-east":[600,1100],"europe":[1100,1900],"asia":[700,1400],"oceania":[700,1200] },
    lodging:   { mid:r(180,320), upscale:r(380,650), luxury:r(700,1600) },
    diveDay:   r(180,280), transfers:r(50,150),
    notes: "Kona, Maui, Big Island all premium-priced. Manta night dives are the marquee." },
  CALIFORNIA_KELP: {
    flights:   { "us-west":[150,400],"us-east":[300,600],"europe":[700,1300],"asia":[700,1300],"oceania":[1100,1900] },
    lodging:   { mid:r(160,280), upscale:r(320,580), luxury:r(650,1200) },
    diveDay:   r(160,260), transfers:r(40,120),
    notes: "Cold-water dry-suit territory; Channel Islands NP, La Jolla. Easy from LAX." },
  FLORIDA: {
    flights:   { "us-west":[300,600],"us-east":[200,500],"europe":[600,1100],"asia":[1200,2000],"oceania":[1400,2200] },
    lodging:   { budget:r(120,210), mid:r(220,380), upscale:r(420,700), luxury:r(800,1500) },
    diveDay:   r(140,220), transfers:r(40,120),
    notes: "Cheap from US East. Florida Keys are the entry point for North American divers." },

  // ---- CARIBBEAN (cheap from US, expensive from EU/Asia) ----
  CARIB_NEARBY: {  // Bahamas, Cayman, Belize, Honduras, Mexico Caribbean
    flights:   { "us-west":[450,900],"us-east":[300,650],"europe":[700,1200],"asia":[1400,2200],"oceania":[1500,2300] },
    lodging:   { budget:r(80,160), mid:r(150,280), upscale:r(300,550), luxury:r(650,1400), liveaboard:r(400,850) },
    diveDay:   r(120,200), transfers:r(40,150),
    notes: "Easy from the US East coast; the long-haul cost is what changes by origin." },
  CARIB_PREMIUM: {  // Cayman, Bonaire, Saba, Jardines de la Reina
    flights:   { "us-west":[500,1000],"us-east":[350,750],"europe":[750,1300],"asia":[1500,2300],"oceania":[1600,2400] },
    lodging:   { mid:r(200,360), upscale:r(380,650), luxury:r(750,1500), liveaboard:r(500,1000) },
    diveDay:   r(150,240), transfers:r(50,180),
    notes: "Higher-end Caribbean. Bonaire shore diving is extraordinary value once you're there." },
  CARIB_EASTERN: {  // Lesser Antilles, St Lucia, Grenada, Tobago, BVI
    flights:   { "us-west":[600,1100],"us-east":[400,800],"europe":[700,1200],"asia":[1500,2300],"oceania":[1700,2500] },
    lodging:   { mid:r(180,320), upscale:r(380,650), luxury:r(750,1500) },
    diveDay:   r(130,210), transfers:r(60,200),
    notes: "Often a multi-stop flight; cruise-ship season can spike prices." },
  CUBA: {
    flights:   { "us-west":[600,1100],"us-east":[400,800],"europe":[800,1400],"asia":[1600,2400],"oceania":[1800,2600] },
    lodging:   { mid:r(120,220), upscale:r(250,450), luxury:r(500,1000), liveaboard:r(550,1100) },
    diveDay:   r(140,220), transfers:r(80,250),
    notes: "Jardines de la Reina is liveaboard-only and requires permits months in advance." },

  // ---- EASTERN PACIFIC LIVEABOARD-HEAVY ----
  COCOS_GALAPAGOS: {  // Cocos, Galápagos, Socorro, Malpelo
    flights:   { "us-west":[700,1300],"us-east":[600,1100],"europe":[1100,1900],"asia":[1800,2700],"oceania":[1800,2600] },
    lodging:   { liveaboard:r(700,1500) },
    transfers:r(150,500), parkFees: 200,
    notes: "Liveaboard-only. 10-day trips $4,000–$7,500. Adds Galápagos national-park fees." },
  COIBA_PACIFIC: {
    flights:   { "us-west":[700,1300],"us-east":[550,1000],"europe":[1000,1800],"asia":[1700,2500],"oceania":[1900,2700] },
    lodging:   { mid:r(120,220), upscale:r(280,500), luxury:r(600,1100), liveaboard:r(450,900) },
    diveDay:   r(160,260), transfers:r(80,300),
    notes: "Day-boat or short-liveaboard options. Coiba park fees apply." },

  // ---- MALDIVES / SEYCHELLES (premium tropical islands) ----
  MALDIVES_PREMIUM: {
    flights:   { "us-west":[1500,2400],"us-east":[1200,2000],"europe":[700,1400],"asia":[400,900],"oceania":[1200,2000] },
    lodging:   { mid:r(280,500), upscale:r(550,1000), luxury:r(1100,3000), liveaboard:r(450,950) },
    diveDay:   r(140,240), transfers:r(150,500),
    notes: "Resort island stays include all meals; seaplane transfers are real money. Liveaboards run 7–10 nights." },
  SEYCHELLES: {
    flights:   { "us-west":[1700,2700],"us-east":[1400,2300],"europe":[800,1500],"asia":[700,1300],"oceania":[1400,2200] },
    lodging:   { mid:r(200,380), upscale:r(450,800), luxury:r(900,2200) },
    diveDay:   r(120,200), transfers:r(80,250),
    notes: "Inter-island ferries / domestic flights add cost. EU is the natural origin." },

  // ---- RED SEA (cheap on the ground, EU-anchored) ----
  RED_SEA_LIVEABOARD: {  // Brothers, Sudan, Daedalus, Marsa Alam liveaboard zones
    flights:   { "us-west":[1300,2200],"us-east":[1000,1800],"europe":[400,900],"asia":[600,1200],"oceania":[1400,2200] },
    lodging:   { mid:r(60,140), upscale:r(150,280), luxury:r(300,650), liveaboard:r(180,400) },
    diveDay:   r(100,180), transfers:r(60,200),
    notes: "Liveaboards from Hurghada or Marsa Alam offer enormous value: 7 nights ~$1,500–$2,800." },
  RED_SEA_RESORT: {  // Sharm, Hurghada, Marsa Alam, Aqaba
    flights:   { "us-west":[1300,2200],"us-east":[1000,1800],"europe":[400,900],"asia":[600,1200],"oceania":[1400,2200] },
    lodging:   { budget:r(40,90), mid:r(80,180), upscale:r(200,400), luxury:r(400,900) },
    diveDay:   r(80,160), transfers:r(40,120),
    notes: "Cheapest credible warm-water dive destination from Europe. Domestic flights from Cairo or Amman are short." },
  ARABIAN_SEA: {  // Daymaniyat, Oman, UAE
    flights:   { "us-west":[1400,2200],"us-east":[1100,1900],"europe":[500,1000],"asia":[400,900],"oceania":[1500,2200] },
    lodging:   { mid:r(120,240), upscale:r(280,500), luxury:r(600,1300) },
    diveDay:   r(120,220), transfers:r(80,250),
    notes: "Whale-shark season Aug–Oct in Daymaniyats. UAE side is more developed." },

  // ---- FRENCH POLYNESIA / PACIFIC ISLANDS ----
  FRENCH_POLYNESIA: {
    flights:   { "us-west":[1100,1900],"us-east":[1400,2300],"europe":[1700,2700],"asia":[1700,2600],"oceania":[700,1300] },
    lodging:   { mid:r(280,500), upscale:r(550,1000), luxury:r(1100,2600), liveaboard:r(550,1100) },
    diveDay:   r(150,260), transfers:r(150,500),
    notes: "Inter-island flights and overwater-bungalow premium drive cost. Diving is excellent value relative to the rooms." },
  FIJI_VANUATU: {
    flights:   { "us-west":[900,1500],"us-east":[1200,2000],"europe":[1400,2300],"asia":[1100,1800],"oceania":[400,900] },
    lodging:   { mid:r(180,320), upscale:r(380,650), luxury:r(800,1700), liveaboard:r(500,1000) },
    diveDay:   r(150,240), transfers:r(80,250),
    notes: "Soft-coral capital of the world (Somosomo Strait). Internal flights add cost." },
  PALAU: {
    flights:   { "us-west":[1100,1900],"us-east":[1400,2300],"europe":[1700,2700],"asia":[700,1300],"oceania":[1100,1800] },
    lodging:   { mid:r(220,400), upscale:r(450,800), luxury:r(900,1800), liveaboard:r(600,1200) },
    diveDay:   r(180,280), transfers:r(60,200), parkFees: 100,
    notes: "Rock Islands permit and pristine paradise fee add up. Often paired with Yap or Truk." },
  YAP_MICRONESIA: {
    flights:   { "us-west":[1100,1900],"us-east":[1400,2300],"europe":[1700,2700],"asia":[700,1300],"oceania":[1100,1800] },
    lodging:   { mid:r(180,340), upscale:r(380,650), luxury:r(750,1400) },
    diveDay:   r(180,280), transfers:r(80,250),
    notes: "Manta cleaning stations year-round. Connectivity from Guam or Manila." },
  TRUK_LAGOON: {
    flights:   { "us-west":[1200,2000],"us-east":[1500,2400],"europe":[1800,2800],"asia":[800,1400],"oceania":[1200,1900] },
    lodging:   { mid:r(160,280), upscale:r(320,550), luxury:r(650,1200), liveaboard:r(450,900) },
    diveDay:   r(160,260), transfers:r(80,250),
    notes: "Wreck-diving destination — typically a dedicated liveaboard week." },
  PNG_REMOTE: {
    flights:   { "us-west":[1300,2100],"us-east":[1600,2500],"europe":[1700,2700],"asia":[800,1500],"oceania":[600,1100] },
    lodging:   { mid:r(220,400), upscale:r(450,800), luxury:r(900,1700), liveaboard:r(550,1100) },
    diveDay:   r(180,280), transfers:r(150,500),
    notes: "Some of the world's most pristine reefs but real travel friction; allow 2–3 travel days each way." },
  SOLOMONS: {
    flights:   { "us-west":[1200,2000],"us-east":[1500,2400],"europe":[1700,2700],"asia":[900,1500],"oceania":[500,1000] },
    lodging:   { mid:r(160,280), upscale:r(320,550), luxury:r(650,1200), liveaboard:r(550,1100) },
    diveDay:   r(160,260), transfers:r(120,400),
    notes: "WWII wrecks and reef in equal measure. Internal logistics dominate the trip cost." },
  NIUE: {
    flights:   { "us-west":[1200,2000],"us-east":[1500,2400],"europe":[1700,2700],"asia":[1500,2300],"oceania":[600,1100] },
    lodging:   { mid:r(140,260), upscale:r(280,500), luxury:r(550,1100) },
    diveDay:   r(160,260), transfers:r(80,200),
    notes: "Whale season (Jul–Oct) is the headline. Limited flights from Auckland." },

  // ---- MEDITERRANEAN (cheap & easy from EU) ----
  MEDITERRANEAN: {
    flights:   { "us-west":[800,1400],"us-east":[500,1000],"europe":[150,500],"asia":[800,1500],"oceania":[1500,2400] },
    lodging:   { budget:r(50,110), mid:r(110,220), upscale:r(240,420), luxury:r(500,1100) },
    diveDay:   r(80,150), transfers:r(40,120),
    notes: "EU-anchored. Diving is not the headline value here — combine with topside travel." },

  // ---- AZORES / CANARIES / MID-ATLANTIC ----
  AZORES: {
    flights:   { "us-west":[700,1300],"us-east":[400,800],"europe":[250,650],"asia":[1100,1900],"oceania":[1700,2500] },
    lodging:   { budget:r(60,130), mid:r(130,240), upscale:r(280,500), luxury:r(550,1100) },
    diveDay:   r(120,200), transfers:r(60,180),
    notes: "Best North-Atlantic dive trip from the US East Coast or EU. Pelagic seamounts." },
  CANARIES: {
    flights:   { "us-west":[900,1500],"us-east":[600,1100],"europe":[150,400],"asia":[1300,2100],"oceania":[1800,2700] },
    lodging:   { budget:r(50,110), mid:r(110,220), upscale:r(240,420), luxury:r(500,1000) },
    diveDay:   r(80,150), transfers:r(40,120),
    notes: "Easy budget Atlantic option from Europe. El Hierro is the diving headline." },
  CAPE_VERDE: {
    flights:   { "us-west":[1100,1800],"us-east":[800,1400],"europe":[400,800],"asia":[1400,2200],"oceania":[1900,2700] },
    lodging:   { budget:r(70,150), mid:r(140,260), upscale:r(280,500), luxury:r(600,1200) },
    diveDay:   r(110,190), transfers:r(60,200),
    notes: "Atlantic islands — limited US connectivity, easy from EU." },
  BRAZIL_OFFSHORE: {
    flights:   { "us-west":[1100,1900],"us-east":[800,1400],"europe":[800,1500],"asia":[1700,2600],"oceania":[2000,2900] },
    lodging:   { mid:r(150,280), upscale:r(320,550), luxury:r(650,1200) },
    diveDay:   r(140,240), transfers:r(100,300),
    notes: "Fernando de Noronha requires a Brazil domestic flight; environmental fee on entry." },
  ARRAIAL_DO_CABO: {
    flights:   { "us-west":[1000,1700],"us-east":[700,1300],"europe":[700,1400],"asia":[1600,2500],"oceania":[1900,2800] },
    lodging:   { budget:r(50,110), mid:r(110,220), upscale:r(240,420), luxury:r(500,1000) },
    diveDay:   r(90,170), transfers:r(40,120),
    notes: "Cold-water Brazilian coast diving. Cheap once you're there." },

  // ---- EAST / SOUTHERN AFRICA + MOZAMBIQUE CHANNEL ----
  EAST_AFRICA_BUDGET: {  // Kenya, Tanzania, Zanzibar, Mozambique
    flights:   { "us-west":[1300,2200],"us-east":[1000,1800],"europe":[600,1200],"asia":[700,1400],"oceania":[1300,2100] },
    lodging:   { budget:r(60,130), mid:r(130,260), upscale:r(280,500), luxury:r(600,1300) },
    diveDay:   r(100,180), transfers:r(80,250),
    notes: "Excellent value once you're there. Long-haul cost dominates." },
  MOZAMBIQUE_PREMIUM: {  // Tofo
    flights:   { "us-west":[1300,2200],"us-east":[1000,1800],"europe":[700,1300],"asia":[800,1500],"oceania":[1400,2200] },
    lodging:   { mid:r(150,280), upscale:r(320,550), luxury:r(650,1200) },
    diveDay:   r(120,200), transfers:r(100,300),
    notes: "Whale shark and manta ocean encounters. Internal flights add overhead." },
  MADAGASCAR_COMOROS: {
    flights:   { "us-west":[1400,2300],"us-east":[1100,1900],"europe":[700,1400],"asia":[900,1500],"oceania":[1400,2200] },
    lodging:   { budget:r(50,120), mid:r(120,240), upscale:r(260,460), luxury:r(550,1100) },
    diveDay:   r(110,190), transfers:r(150,500),
    notes: "Remote and inconvenient — but reefs are uncrowded." },
  SOUTH_AFRICA: {
    flights:   { "us-west":[1300,2200],"us-east":[1000,1800],"europe":[700,1400],"asia":[900,1500],"oceania":[1400,2200] },
    lodging:   { budget:r(50,110), mid:r(110,220), upscale:r(240,420), luxury:r(500,1100) },
    diveDay:   r(100,180), transfers:r(80,250),
    notes: "Sardine run and sodwana shark dives. Strong USD goes far in ZAR." },
  DJIBOUTI_GULF_OF_ADEN: {
    flights:   { "us-west":[1500,2400],"us-east":[1200,2000],"europe":[600,1200],"asia":[800,1400],"oceania":[1500,2300] },
    lodging:   { mid:r(150,280), upscale:r(320,550), luxury:r(650,1200) },
    diveDay:   r(140,240), transfers:r(100,300),
    notes: "Whale shark season Oct–Feb is the draw. Limited operators." },
  WEST_AFRICA_REMOTE: {  // São Tomé
    flights:   { "us-west":[1500,2400],"us-east":[1200,2000],"europe":[800,1500],"asia":[1700,2600],"oceania":[2200,3000] },
    lodging:   { mid:r(140,260), upscale:r(300,550), luxury:r(650,1300) },
    diveDay:   r(120,210), transfers:r(150,500),
    notes: "Real travel friction but completely unique equatorial Atlantic ecology." },

  // ---- SOUTH ASIA / ANDAMAN / GULF OF THAILAND ----
  SOUTH_ASIA: {  // Sri Lanka, Lakshadweep, Andamans
    flights:   { "us-west":[1300,2100],"us-east":[1000,1800],"europe":[700,1300],"asia":[200,600],"oceania":[1200,2000] },
    lodging:   { budget:r(40,90), mid:r(100,220), upscale:r(240,440), luxury:r(550,1200) },
    diveDay:   r(80,160), transfers:r(80,250),
    notes: "Cheap on the ground but seasonality narrow (Nov–Apr)." },
  ANDAMAN_THAILAND: {  // Similan, Richelieu, Mergui
    flights:   { "us-west":[1100,1900],"us-east":[1400,2300],"europe":[700,1400],"asia":[200,600],"oceania":[800,1400] },
    lodging:   { budget:r(40,90), mid:r(100,220), upscale:r(240,440), luxury:r(550,1200), liveaboard:r(280,650) },
    diveDay:   r(90,170), transfers:r(80,250),
    notes: "Phuket gateway; liveaboards run Nov–Apr. Burma side requires permits." },
  GULF_THAILAND: {
    flights:   { "us-west":[1000,1800],"us-east":[1300,2200],"europe":[700,1400],"asia":[150,500],"oceania":[700,1300] },
    lodging:   { budget:r(20,60), mid:r(60,140), upscale:r(160,320), luxury:r(380,800) },
    diveDay:   r(70,130), transfers:r(40,150),
    notes: "Cheapest open-water cert in the world (Koh Tao). Backpacker-friendly." },
  VIETNAM_HAINAN: {
    flights:   { "us-west":[1100,1900],"us-east":[1400,2300],"europe":[800,1500],"asia":[200,600],"oceania":[900,1500] },
    lodging:   { budget:r(30,80), mid:r(80,180), upscale:r(200,400), luxury:r(450,900) },
    diveDay:   r(70,140), transfers:r(40,150),
    notes: "Inexpensive coastal diving with growing reef recovery efforts." },

  // ---- JAPAN / TAIWAN / KOREA ----
  JAPAN_DIVING: {
    flights:   { "us-west":[800,1500],"us-east":[1100,1900],"europe":[900,1700],"asia":[300,700],"oceania":[800,1400] },
    lodging:   { budget:r(80,160), mid:r(150,280), upscale:r(320,550), luxury:r(650,1300) },
    diveDay:   r(140,230), transfers:r(80,250),
    notes: "High-quality and well-organised but pricier than other Asian destinations." },
  TAIWAN_DIVING: {
    flights:   { "us-west":[900,1600],"us-east":[1200,2000],"europe":[1000,1800],"asia":[300,700],"oceania":[900,1500] },
    lodging:   { budget:r(50,110), mid:r(110,220), upscale:r(240,420), luxury:r(500,1000) },
    diveDay:   r(90,160), transfers:r(60,180),
    notes: "Green Island is the headline. Easy from Taipei." },
  KOREA_DIVING: {
    flights:   { "us-west":[800,1500],"us-east":[1100,1900],"europe":[1000,1800],"asia":[300,700],"oceania":[900,1500] },
    lodging:   { budget:r(60,130), mid:r(130,240), upscale:r(280,480), luxury:r(550,1100) },
    diveDay:   r(120,200), transfers:r(60,180),
    notes: "Subtropical Jeju diving. EU-style cost structure." },

  // ---- NEW ZEALAND / FIORDLAND ----
  NZ_NORTH: {
    flights:   { "us-west":[1000,1700],"us-east":[1300,2200],"europe":[1500,2400],"asia":[900,1600],"oceania":[200,600] },
    lodging:   { budget:r(80,160), mid:r(150,280), upscale:r(320,550), luxury:r(650,1200) },
    diveDay:   r(180,280), transfers:r(60,200),
    notes: "Poor Knights diving from Tutukaka. Subtropical despite the latitude." },

  // ---- ICELAND (cold-water freshwater) ----
  ICELAND_SILFRA: {
    flights:   { "us-west":[700,1300],"us-east":[400,800],"europe":[250,600],"asia":[1100,1800],"oceania":[1800,2700] },
    lodging:   { budget:r(120,220), mid:r(220,400), upscale:r(450,800), luxury:r(900,1700) },
    diveDay:   r(280,420), transfers:r(80,250),
    notes: "Silfra fissure dry-suit dive — usually a half-day add-on to a Reykjavik trip. Pricey country." },

  // ---- CENOTES ----
  CENOTES_MEX: {
    flights:   { "us-west":[400,800],"us-east":[250,600],"europe":[700,1300],"asia":[1400,2200],"oceania":[1500,2300] },
    lodging:   { budget:r(60,140), mid:r(130,260), upscale:r(280,500), luxury:r(600,1300) },
    diveDay:   r(150,250), transfers:r(40,150),
    notes: "Cenote diving from Tulum/Playa. Each cenote has its own park fee." },

  // ---- BALI (separate from CT — easier logistics) ----
  BALI: {
    flights:   { "us-west":[1000,1700],"us-east":[1300,2200],"europe":[900,1700],"asia":[300,700],"oceania":[500,1100] },
    lodging:   { budget:r(30,80), mid:r(80,180), upscale:r(220,400), luxury:r(500,1300) },
    diveDay:   r(80,150), transfers:r(40,150),
    notes: "Easy and cheap — Tulamben + Nusa Penida + Amed. Direct flights from major Asian hubs." },
};

// Per-location plan: locationId → templateKey + optional override notes.
const PLAN = {
  // Coral Triangle
  "raja-ampat-indonesia":          ["CT_REMOTE", null],
  "komodo-national-park-indonesia":["CT_REMOTE", null],
  "tulamben-bali-indonesia":       ["BALI", null],
  "bunaken-indonesia":             ["CT_BUDGET", null],
  // Philippines
  "malapascua-philippines":        ["PHILIPPINES_BUDGET", null],
  "tubbataha-philippines":         ["PHILIPPINES_BUDGET", "Tubbataha is liveaboard-only March–June. Park fees apply."],
  "apo-reef-philippines":          ["PHILIPPINES_BUDGET", null],
  "moalboal-philippines":          ["PHILIPPINES_BUDGET", null],
  // Malaysia
  "sipadan-malaysia":              ["MALAYSIA_BUDGET", null],
  "mabul-malaysia":                ["MALAYSIA_BUDGET", null],
  "layang-layang-malaysia":        ["MALAYSIA_BUDGET", "Liveaboard or remote-resort only; flights to Kota Kinabalu add a leg."],
  // GBR / Australia
  "cod-hole-australia":            ["GBR_PREMIUM", null],
  "ningaloo-australia":            ["NINGALOO", null],
  "julian-rocks-australia":        ["NSW_TEMPERATE", null],
  // Hawaii / Pacific US
  "kona-hawaii-usa":               ["HAWAII_PREMIUM", null],
  "channel-islands-usa":           ["CALIFORNIA_KELP", null],
  "florida-keys-usa":              ["FLORIDA", null],
  // Caribbean
  "cozumel-mexico":                ["CARIB_NEARBY", null],
  "cenotes-mexico":                ["CENOTES_MEX", null],
  "tiger-beach-bahamas":           ["CARIB_NEARBY", "Tiger Beach is liveaboard-only. 4–7 night trips $2,500–$4,500."],
  "exuma-cays-bahamas":            ["CARIB_NEARBY", null],
  "silver-bank-dominican-republic":["CARIB_NEARBY", "Liveaboard whale-watching, not diving. 7 nights $3,500–$5,500."],
  "blue-hole-belize":              ["CARIB_NEARBY", "Day trip from Ambergris/Caye Caulker. Booking fee plus marine reserve fee."],
  "the-pit-belize":                ["CENOTES_MEX", null],
  "turneffe-belize":               ["CARIB_NEARBY", null],
  "utila-honduras":                ["CARIB_NEARBY", "Best open-water cert value in the Caribbean."],
  "roatan-honduras":               ["CARIB_NEARBY", null],
  "bocas-del-toro-panama":         ["CARIB_NEARBY", null],
  "coiba-panama":                  ["COIBA_PACIFIC", null],
  "providencia-colombia":          ["CARIB_NEARBY", "Internal flight from San Andrés adds a leg."],
  "malpelo-colombia":              ["COCOS_GALAPAGOS", null],
  "cocos-costa-rica":              ["COCOS_GALAPAGOS", "10-12 day liveaboards typical; book 12+ months ahead."],
  "catalina-islands-costa-rica":   ["COIBA_PACIFIC", null],
  "wolf-galapagos-ecuador":        ["COCOS_GALAPAGOS", "Galápagos national park fee + transit card on top of liveaboard."],
  "darwin-galapagos-ecuador":      ["COCOS_GALAPAGOS", "Galápagos national park fee + transit card on top of liveaboard."],
  "socorro-mexico":                ["COCOS_GALAPAGOS", null],
  "los-roques-venezuela":          ["CARIB_NEARBY", null],
  "bonaire-national-marine-park-bonaire": ["CARIB_PREMIUM", "Famously shore-diving-friendly — rent a truck and tanks, dive at your own pace."],
  "westpunt-curacao":              ["CARIB_NEARBY", null],
  "bloody-bay-wall-cayman-islands":["CARIB_PREMIUM", null],
  "stingray-city-cayman-islands":  ["CARIB_PREMIUM", null],
  "saba-saba":                     ["CARIB_PREMIUM", "Two-flight transit (St Maarten → Saba)."],
  "statia-st-eustatius":           ["CARIB_EASTERN", null],
  "grenada-bianca-c":              ["CARIB_EASTERN", null],
  "cuba-jardines-de-la-reina":     ["CUBA", "Permit-only liveaboard; 6-night minimum."],
  "anse-chastanet-saint-lucia":    ["CARIB_EASTERN", null],
  "tobago-speyside-trinidad-and-tobago": ["CARIB_EASTERN", null],
  "salt-island-bvi":               ["CARIB_EASTERN", null],

  // Maldives / Indian Ocean
  "north-male-atoll-maldives":     ["MALDIVES_PREMIUM", null],
  "ari-atoll-maldives":            ["MALDIVES_PREMIUM", null],
  "lakshadweep-india":             ["SOUTH_ASIA", "Permit-only; only Indian and accredited foreign divers allowed."],
  "andaman-islands-india":         ["SOUTH_ASIA", null],
  "mahe-seychelles":               ["SEYCHELLES", null],
  "praslin-seychelles":            ["SEYCHELLES", null],

  // Africa
  "watamu-kenya":                  ["EAST_AFRICA_BUDGET", null],
  "tofo-mozambique":               ["MOZAMBIQUE_PREMIUM", null],
  "nosy-be-madagascar":            ["MADAGASCAR_COMOROS", null],
  "grande-comore-comoros":         ["MADAGASCAR_COMOROS", null],
  "mnemba-tanzania":               ["EAST_AFRICA_BUDGET", null],
  "aliwal-south-africa":           ["SOUTH_AFRICA", null],
  "sodwana-south-africa":          ["SOUTH_AFRICA", null],
  "djibouti-gulf-of-tadjoura":     ["DJIBOUTI_GULF_OF_ADEN", null],
  "sao-tome-sao-tome-and-principe":["WEST_AFRICA_REMOTE", null],

  // Red Sea
  "ras-mohammed-egypt":            ["RED_SEA_RESORT", "Sharm el Sheikh resort base; Ras Mohammed park fee applies."],
  "aqaba-jordan":                  ["RED_SEA_RESORT", null],
  "jeddah-saudi-arabia":           ["RED_SEA_RESORT", "Saudi tourist visa required; new infrastructure."],
  "brothers-egypt":                ["RED_SEA_LIVEABOARD", "Brothers/Daedalus/Elphinstone southern itinerary."],
  "sudan-shaab-rumi":              ["RED_SEA_LIVEABOARD", "Charter from Port Sudan; multi-day liveaboards only."],
  "dahlak-eritrea":                ["RED_SEA_LIVEABOARD", "Remote, limited operators; permit-heavy logistics."],
  "fujairah-uae":                  ["ARABIAN_SEA", null],
  "daymaniyat-oman":               ["ARABIAN_SEA", "Whale shark season Aug–Oct; day-boat from Muscat."],

  // French Polynesia / Pacific
  "rangiroa-french-polynesia":     ["FRENCH_POLYNESIA", null],
  "fakarava-french-polynesia":     ["FRENCH_POLYNESIA", null],
  "niue-avaiki-cave":              ["NIUE", null],

  // Western Pacific
  "blue-corner-palau":             ["PALAU", null],
  "jellyfish-lake-palau":          ["PALAU", null],
  "manta-ridge-yap":               ["YAP_MICRONESIA", null],
  "chuuk-lagoon-fsm":              ["TRUK_LAGOON", null],

  // Fiji / Vanuatu
  "beqa-lagoon-fiji":              ["FIJI_VANUATU", null],
  "great-white-wall-fiji":         ["FIJI_VANUATU", null],
  "president-coolidge-vanuatu":    ["FIJI_VANUATU", "Iconic shore-accessible WWII wreck."],

  // PNG / Solomons
  "milne-bay-papua-new-guinea":    ["PNG_REMOTE", null],
  "kimbe-bay-papua-new-guinea":    ["PNG_REMOTE", null],
  "bonegi-solomon-islands":        ["SOLOMONS", null],

  // Japan / Taiwan / Korea
  "yonaguni-japan":                ["JAPAN_DIVING", "Domestic flight from Naha; hammerhead season Dec–Feb."],
  "ogasawara-japan":               ["JAPAN_DIVING", "25-hour ferry from Tokyo; cetacean encounters seasonally."],
  "green-island-taiwan":           ["TAIWAN_DIVING", null],
  "jeju-south-korea":              ["KOREA_DIVING", null],

  // Mediterranean
  "vis-croatia":                   ["MEDITERRANEAN", null],
  "kornati-croatia":               ["MEDITERRANEAN", null],
  "medes-islands-spain":           ["MEDITERRANEAN", null],
  "gozo-malta":                    ["MEDITERRANEAN", null],
  "sardinia-italy":                ["MEDITERRANEAN", null],
  "larnaca-cyprus":                ["MEDITERRANEAN", "Zenobia wreck access from Larnaca."],

  // Atlantic islands
  "azores-portugal":               ["AZORES", null],
  "el-hierro-spain":               ["CANARIES", null],
  "sal-cape-verde":                ["CAPE_VERDE", null],
  "fernando-de-noronha-brazil":    ["BRAZIL_OFFSHORE", "Environmental preservation fee on entry."],
  "arraial-do-cabo-brazil":        ["ARRAIAL_DO_CABO", null],

  // South Asia / Andaman / SE Asia
  "trincomalee-sri-lanka":         ["SOUTH_ASIA", null],
  "hikkaduwa-sri-lanka":           ["SOUTH_ASIA", null],
  "similan-islands-thailand":      ["ANDAMAN_THAILAND", "Liveaboard-only Nov–Apr."],
  "richelieu-rock-thailand":       ["ANDAMAN_THAILAND", null],
  "mergui-archipelago-myanmar":    ["ANDAMAN_THAILAND", "Myanmar permits add ~$300/traveller."],
  "koh-tao-thailand":              ["GULF_THAILAND", null],
  "koh-rong-cambodia":             ["GULF_THAILAND", null],
  "nha-trang-vietnam":             ["VIETNAM_HAINAN", null],
  "sanya-china":                   ["VIETNAM_HAINAN", null],

  // NZ
  "poor-knights-new-zealand":      ["NZ_NORTH", null],
  "milford-sound-new-zealand":     ["NZ_NORTH", "Fjord dry-suit diving from Te Anau."],

  // Iceland
  "silfra-iceland":                ["ICELAND_SILFRA", null],
};

function buildRecord(loc, templateKey, overrideNote) {
  const t = T[templateKey];
  if (!t) return null;
  const rec = {
    id: "trip-cost-" + loc.id + "-2026",
    locationId: loc.id,
    currency: "USD",
    flightUsdFromHub: rewriteRanges(t.flights),
    perNightLodgingUsd: rewriteRanges(t.lodging),
    ...(t.diveDay ? { diveDayUsd: rewriteRanges({ d: t.diveDay }).d } : {}),
    ...(t.transfers ? { localTransfersUsd: rewriteRanges({ d: t.transfers }).d } : {}),
    ...(t.parkFees ? { parkFeesUsd: t.parkFees } : {}),
    notes: overrideNote ?? t.notes,
    sourceIds: ["editorial-curation"],
    methodologyClaimIds: ["trip-cost-editorial-2026"],
    lastReviewedAt: "2026-05-24",
  };
  return rec;
}

async function main() {
  const locations = JSON.parse(await fs.readFile(LOC_PATH, "utf8"));
  let existing = [];
  try {
    existing = JSON.parse(await fs.readFile(TC_PATH, "utf8"));
  } catch {
    existing = [];
  }
  const existingLocs = new Set(existing.map((r) => r.locationId));
  const additions = [];
  const unmapped = [];

  for (const loc of locations) {
    if (existingLocs.has(loc.id)) continue;
    const plan = PLAN[loc.id];
    if (!plan) {
      unmapped.push(loc.id);
      continue;
    }
    const [templateKey, note] = plan;
    const rec = buildRecord(loc, templateKey, note);
    if (rec) additions.push(rec);
    else unmapped.push(loc.id + " (bad template " + templateKey + ")");
  }

  const out = [...existing, ...additions];
  await fs.writeFile(TC_PATH, JSON.stringify(out, null, 2) + "\n");

  console.log("Trip-cost backfill complete:");
  console.log("  Existing records preserved:", existing.length);
  console.log("  New records added:         ", additions.length);
  console.log("  Total records on disk:     ", out.length);
  console.log("  Unmapped locations:        ", unmapped.length);
  for (const u of unmapped.slice(0, 30)) console.log("    -", u);
  if (unmapped.length > 30) console.log("    ... and", unmapped.length - 30, "more");
}

main().catch((err) => { console.error(err); process.exit(1); });

#!/usr/bin/env node
/**
 * De-duplicate colliding LOCATION hero photos by assigning fresh, globally
 * unique Ocean Image Bank heroes from the large unused OIB pool.
 *
 * Only touches: (a) the "loser" of each location hero-URL collision group
 * (first occurrence in file keeps its URL, the rest are re-sourced), and
 * (b) any location slug passed via --extra=slug (used for lysefjord aquarium).
 *
 * Quality bar: a candidate OIB image is eligible only if it passes the
 * SURFACE_REJECT filter AND its alt text contains a POSITIVE underwater noun.
 * This keeps icebergs / mangroves / surface-whale shots out. Every pick is
 * still visually verified by hand after localization.
 *
 *   node scripts/dedupe-collisions-oib.mjs --dry     # print picks + alt text
 *   node scripts/dedupe-collisions-oib.mjs           # write preview-CDN URLs
 *
 * Writes preview-CDN URLs; follow with localize-oib-heroes.mjs to self-host.
 */
import fs from "node:fs/promises";
import path from "node:path";
import { loadRegistry, isUsed, markUsed, saveRegistry } from "./lib/photo-registry.mjs";

const ROOT = path.resolve(new URL("..", import.meta.url).pathname);
const LOCATIONS_PATH = path.join(ROOT, "src/data/locations.json");
const SITES_PATH = path.join(ROOT, "src/data/sites.json");
const PRISMIC_API = "https://ocean-agency-cms.prismic.io/api/v2";
const PRISMIC_GQL = "https://ocean-agency-cms.prismic.io/graphql";
const CDN = "https://d1qsp4j04beddk.cloudfront.net";
const UA = "scubaseason.fun hero dedupe (josie.ty.leung@gmail.com)";
const DRY = process.argv.includes("--dry");
const EXTRA = process.argv.filter(a => a.startsWith("--extra=")).map(a => a.split("=")[1]);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
// OIB filenames whose CDN assets 403/404 on both preview + full-res — never pick these.
const BLACKLIST = new Set([
  "OceanImageBank_SamanthaSchwann_28.jpg", "OceanImageBank_HannesKlostermann_24.jpg",
  "OceanImageBank_TobyMatthews_10.jpg", "OceanImageBank_SamanthaSchwann_11.jpg",
  "OceanImageBank_SamanthaSchwann_7.jpg", "OceanImageBank_SamanthaSchwann_31.jpg",
  "OceanImageBank_SamanthaSchwann_25.jpg", "OceanImageBank_SamanthaSchwann_32.jpg",
  "OceanImageBank_IndigoBolandrini_02.jpg", "OceanImageBank_SamanthaSchwann_27.jpg",
  "OceanImageBank_JuanCamiloMora_03.jpg",
  // Rejected on visual verification (surface / split-level over-under):
  "OceanImageBank_HughWhyte_13.jpg", "OceanImageBank_TheOceanAgency_360_27.jpg",
]);
// Slugs to force re-source even if not colliding (visual-verification rejects).
const RESOURCE = process.argv.filter(a => a.startsWith("--resource=")).flatMap(a => a.split("=")[1].split(","));
const PREVIEW_CDN_HOST = "d1qsp4j04beddk"; // re-source any location left on the dead preview CDN

const SURFACE_REJECT = [
  /\bboat\b/, /\bvessel\b/, /\bship\b(?!wreck)/, /\bfisherman\b/, /\bfishing\b/,
  /\bharbou?r\b/, /\bport\b/, /\bpier\b/, /\bdock\b/,
  /\bbeach\b/, /\bcoastline\b/, /\bshoreline\b/, /\bsurface\b/,
  /\bsunrise\b/, /\bsunset\b/, /\bhorizon\b/, /\bmangrove\b/,
  /\baerial\b/, /\bfrom above\b/, /\bdrone\b/, /\boverhead\b/, /\biceberg\b/, /\bglacier\b/,
  /\bdiver\b/, /\bfree.?div/, /\bsnorkel/, /\bswimmer\b/, /\bperson\b/, /\bpeople\b/,
  /\bvillage\b/, /\bmarket\b/, /\bstreet\b/, /\bforest\b/, /\bjungle\b/, /\btree\b/,
  /\bpenguin\b/, /\bpolar bear\b/, /\bwalrus\b/, /\bbird\b/, /\bseal\b/, /\bsea lion\b/,
];
// A curated OIB image is accepted only if its alt text has one of these.
const POSITIVE_UW = [
  "coral", "reef", "fish", "shark", "turtle", "manta", "ray", "rays", "wreck",
  "kelp", "anemone", "nudibranch", "octopus", "seahorse", "school of", "shoal",
  "grouper", "barracuda", "jellyfish", "whale shark", "eel", "sponge", "crinoid",
  "underwater", "scuba", "dolphin", "sardine", "damselfish", "clownfish", "sea fan",
];
function norm(s){return (s||"").toLowerCase().replace(/[^a-z0-9\s]/g," ").replace(/\s+/g," ").trim();}
function isUnderwaterOIB(img){
  const text = ((img.alternative_text||"")+" "+(img.name||"")).toLowerCase();
  if (SURFACE_REJECT.some(p=>p.test(text))) return false;
  return POSITIVE_UW.some(w=>text.includes(w));
}

// scoring (mirror of fetch-ocean-image-bank.mjs)
const NOISE = new Set(["the","and","for","with","from","dive","site","reef","wall","point","rock","underwater","coral","fish","diving","scuba","water","ocean","marine","park","national","island","islands","archipelago","bank","channel","passage","north","south","east","west","great","southern","eastern","western","northern","lake","lagoon","blue","black","white","deep","open"]);
function tokenize(t){return norm(t).split(" ").filter(x=>x.length>=3);}
function meaningful(ts){return ts.filter(t=>!NOISE.has(t)&&t.length>=4);}
const REGION_GROUPS = [
  ["indonesia","philippines","malaysia","palau","micronesia","papua","solomon","vanuatu","fiji","timor","sulawesi","borneo","bali","komodo","raja ampat","banda","coral triangle","pacific","indo pacific"],
  ["maldives","thailand","myanmar","cambodia","vietnam","lanka","india","andaman","indian ocean","mozambique","tanzania","kenya","seychelles","comoros","mauritius","red sea","egypt","oman","djibouti"],
  ["caribbean","bahamas","cayman","belize","honduras","costa rica","colombia","cuba","mexico","bonaire","curacao","aruba","barbados","trinidad","jamaica","dominican","puerto rico","virgin islands","saint lucia"],
  ["mediterranean","croatia","italy","spain","malta","greece","cyprus","turkey","france"],
  ["atlantic","azores","canary","cape verde","portugal","scotland","norway","uk","ireland","iceland","florida","bermuda"],
  ["galapagos","ecuador","peru","chile","cocos"],
  ["australia","new zealand","great barrier reef","ningaloo","lord howe"],
  ["japan","korea","china","taiwan","okinawa"],
];
function regionOf(text){const t=norm(text);for(let i=0;i<REGION_GROUPS.length;i++){if(REGION_GROUPS[i].some(w=>t.includes(w)))return i;}return -1;}
function scoreImage(img,keywords){const hay=norm(`${img.alternative_text} ${img.name}`);let s=0;for(const kw of keywords){if(hay.includes(kw))s+=kw.length;}return s;}

async function getRef(){const r=await fetch(PRISMIC_API,{headers:{"User-Agent":UA}});const d=await r.json();return d.refs.find(x=>x.id==="master").ref;}
async function fetchPage(ref,cursor){const q=`query{allImages(fulltext:"",after:"${cursor}",sortBy:general_weight_DESC,first:100){pageInfo{hasNextPage endCursor} edges{node{name alternative_text credits{author}}}}}`;const r=await fetch(`${PRISMIC_GQL}?query=${encodeURI(q.trim())}`,{headers:{"Prismic-Ref":ref,Accept:"application/json","User-Agent":UA}});return r.json();}
async function fetchAll(){const ref=await getRef();let cursor="",all=[];while(true){const d=await fetchPage(ref,cursor);const res=d.data?.allImages;if(!res)break;const imgs=res.edges.map(e=>e.node).filter(n=>n.name&&!/\.(mp4|mov|gif)$/i.test(n.name));all=all.concat(imgs);if(!res.pageInfo.hasNextPage)break;cursor=res.pageInfo.endCursor;await sleep(300);}return all;}

function buildLocationKeywords(loc, locSites){
  const raw=[loc.name,loc.country,loc.region,...locSites.flatMap(s=>(s.species||[]).slice(0,3).map(sp=>sp.commonName||sp.name).filter(Boolean)).slice(0,6)].filter(Boolean);
  return [...new Set(meaningful(raw.flatMap(tokenize)))];
}

async function main(){
  await loadRegistry();
  const locations=JSON.parse(await fs.readFile(LOCATIONS_PATH,"utf8"));
  const sites=JSON.parse(await fs.readFile(SITES_PATH,"utf8"));
  const sitesByLoc=new Map();
  for(const s of sites){if(!sitesByLoc.has(s.locationId))sitesByLoc.set(s.locationId,[]);sitesByLoc.get(s.locationId).push(s);}
  // seed registry from all existing heroes
  for(const s of sites) if(s.heroImageUrl&&!isUsed(s.heroImageUrl)) markUsed(s.heroImageUrl,s.slug);
  for(const l of locations) if(l.heroImageUrl&&!isUsed(l.heroImageUrl)) markUsed(l.heroImageUrl,l.slug);

  // identify collision losers (keep first in file order)
  const seen=new Map();
  const losers=[];
  for(const l of locations){const u=l.heroImageUrl;if(!u)continue;if(seen.has(u))losers.push(l);else seen.set(u,l.slug);}
  // re-source any location left on the dead preview CDN
  for(const l of locations){if(l.heroImageUrl&&l.heroImageUrl.includes(PREVIEW_CDN_HOST)&&!losers.includes(l)){losers.push(l);delete l.heroImageUrl;}}
  // add extras (e.g. lysefjord)
  for(const slug of EXTRA){const l=locations.find(x=>x.slug===slug);if(l&&!losers.includes(l))losers.push(l);}
  // force re-source (visual-verification rejects)
  for(const slug of RESOURCE){const l=locations.find(x=>x.slug===slug);if(l&&!losers.includes(l)){losers.push(l);delete l.heroImageUrl;}}
  console.log(`Loser locations to re-source: ${losers.length} (collision losers + ${EXTRA.length} extra)`);

  console.log("Fetching OIB catalogue…");
  const oib=(await fetchAll()).filter(img=>isUnderwaterOIB(img)&&!BLACKLIST.has(img.name));
  console.log(`OIB underwater+positive-alt candidates: ${oib.length}`);

  const assigned=new Set();
  function pickBest(keywords, region){
    let best=null,bestScore=-1;
    for(const img of oib){
      const url=`${CDN}/${img.name}`;
      if(assigned.has(url)||isUsed(url))continue;
      let score=scoreImage(img,keywords);
      if(region>=0){const ir=regionOf(img.alternative_text);if(ir>=0&&ir!==region)score=Math.floor(score*0.3);else if(ir===region)score+=3;}
      if(score>bestScore){bestScore=score;best=img;}
    }
    return best?{url:`${CDN}/${best.name}`,img:best,score:bestScore}:null;
  }

  const report=[];
  for(const loc of losers){
    const kw=buildLocationKeywords(loc,sitesByLoc.get(loc.id)??[]);
    const region=regionOf(`${loc.country??""} ${loc.region??""} ${loc.name??""}`);
    const pick=pickBest(kw,region);
    if(!pick){report.push({slug:loc.slug,status:"NO-PICK"});continue;}
    assigned.add(pick.url);
    const author=pick.img.credits?.[0]?.author??"Ocean Image Bank";
    if(!DRY){loc.heroImageUrl=pick.url;markUsed(pick.url,loc.slug);}
    report.push({slug:loc.slug,url:pick.url,alt:pick.img.alternative_text,score:pick.score,author,region,country:loc.country});
  }

  for(const r of report){
    if(r.status==="NO-PICK"){console.log(`[∅] ${r.slug}  NO PICK`);continue;}
    console.log(`[✓] ${r.slug} (${r.country})  score=${r.score}\n     alt: "${r.alt}"\n     ${r.url.split("/").pop()}`);
  }
  const miss=report.filter(r=>r.status==="NO-PICK").length;
  console.log(`\nPicked: ${report.length-miss} | no-pick: ${miss}`);

  if(!DRY){
    await fs.writeFile(LOCATIONS_PATH,JSON.stringify(locations,null,2)+"\n");
    await saveRegistry();
    console.log("Wrote locations.json + registry.");
  } else { console.log("[dry] nothing written."); }
}
main().catch(e=>{console.error(e);process.exit(1);});

#!/usr/bin/env node
import fs from "node:fs/promises";
import { pexelsSearch } from "./lib/photo-sources.mjs";
import { loadRegistry, isUsed, markUsed, saveRegistry } from "./lib/photo-registry.mjs";

const SITES_PATH = "src/data/sites.json";
const LOCS_PATH = "src/data/locations.json";
const sleep = ms => new Promise(r => setTimeout(r, ms));

const BLACKLIST_IDS = new Set([
  "38156461","36197844","35812286","30419280","12890017","4816318","4621616",
  "10519044","30518295","35974038","13010778","32293259","5061256","26737932",
  "35381728","18750732","36993199","13010777","34609171","3402385","17194902",
  "32768858","36287237","4717847","33968347","35974035","2575271",
]);
const isBlacklisted = url => { const m = url?.match(/\/photos\/(\d+)\//); return m && BLACKLIST_IDS.has(m[1]); };

const TARGETED = {
  // --- LOCATIONS ---
  "koh-lipe-thailand": ["leopard shark sandy bottom Thailand underwater","sea turtle coral reef Andaman Sea Thailand","reef fish coral garden Thailand underwater"],
  "lombok": ["blacktip reef shark coral Indonesia underwater","whitetip reef shark tropical coral Indonesia","sea turtle coral reef Indonesia tropical underwater"],
  "perhentian-islands": ["hawksbill sea turtle coral reef Malaysia underwater","blacktip reef shark coral reef Malaysia","nudibranch macro underwater Malaysia reef"],
  "coral-bay-wa": ["manta ray underwater blue ocean reef","oceanic manta ray reef underwater blue","sea turtle Australian reef underwater warm"],
  "exmouth-wa": ["wobbegong shark Australian reef underwater","nurse shark sandy reef Western Australia underwater","sea turtle coral reef Western Australia"],
  "bay-of-islands-nz": ["common dolphin underwater New Zealand ocean","nudibranch temperate reef New Zealand underwater","kelp forest fish New Zealand underwater"],
  "bora-bora-fp": ["lemon shark lagoon French Polynesia underwater","blacktip shark coral bommie underwater tropical","eagle ray coral lagoon French Polynesia underwater"],
  "fakarava": ["grey reef shark French Polynesia underwater reef","shark wall drift diving French Polynesia","Napoleon wrasse coral reef French Polynesia"],
  "moorea": ["blacktip shark lagoon French Polynesia reef","spinner dolphin underwater French Polynesia","coral garden French Polynesia underwater reef fish"],
  "cartagena-rosario-islands": ["Caribbean coral reef fish underwater colorful","stingray Caribbean reef underwater tropical","coral reef Colombia Caribbean underwater fish"],
  "manta-ecuador": ["giant manta ray oceanic underwater Pacific","manta ray group underwater Pacific Ecuador","hammerhead shark school Pacific Ecuador underwater"],
  "cabo-san-lucas": ["California sea lion underwater Pacific ocean","sea lion underwater kelp Pacific","Galapagos sea lion underwater reef rocks"],
  "puerto-vallarta": ["giant manta ray underwater Pacific Mexico","spotted eagle ray school underwater Pacific","humpback whale underwater ocean Pacific"],
  "vancouver-island": ["giant Pacific octopus cold water kelp underwater","wolf eel cold water rocky reef underwater","lingcod underwater Pacific Northwest reef"],
  "san-juan-islands": ["giant Pacific octopus underwater kelp forest","cold water kelp forest fish Pacific Northwest","wolf eel cold water underwater Pacific Northwest"],
  "nice-cote-dazur-france": ["red scorpionfish Mediterranean rocky reef underwater","Mediterranean grouper rocky reef underwater","sea fan Mediterranean underwater rocky reef"],
  "puerto-princesa-honda-bay": ["nurse shark sandy reef Philippines underwater","sea turtle Philippines reef underwater tropical","coral reef Philippines Palawan underwater fish"],
  "siargao": ["stingless jellyfish underwater lake Philippines","ornate ghost pipefish macro Philippines reef","pygmy seahorse coral Philippines underwater macro"],
  "ternate-north-maluku": ["pygmy seahorse black sand Indonesia underwater","frogfish black sand macro Indonesia Maluku","mimic octopus Indonesia muck dive underwater"],
  "tufi-papua-new-guinea": ["coral wall Papua New Guinea underwater reef","mandarin fish coral PNG underwater","pygmy seahorse coral Papua New Guinea underwater macro"],
  "terceira-azores": ["blue shark Atlantic underwater Azores","mobula ray Atlantic underwater ocean","common dolphin underwater Atlantic Azores"],
  // --- SITES ---
  "koh-lipe-stonehenge": ["staghorn coral garden Thailand underwater","table coral reef Andaman Sea underwater","coral bommie fish tropical Thailand underwater"],
  "koh-lipe-koh-usen": ["leopard shark resting sandy bottom underwater","nurse shark sandy reef tropical underwater","reef shark resting bottom tropical reef"],
  "koh-lipe-hin-ngam": ["hard coral reef tropical fish school underwater","tropical reef fish school underwater colorful","acropora coral school fish Thailand underwater"],
  "lombok-shark-point": ["whitetip reef shark coral Indonesia underwater","blacktip reef shark tropical reef Indonesia","reef shark school coral wall underwater"],
  "lombok-halik-reef": ["coral reef fish Indonesia underwater colorful","tropical reef fish Indonesia Lombok underwater","hard coral garden fish Indonesia underwater"],
  "lombok-gili-trawangan-wall": ["coral wall Indonesia tropical reef fish underwater","vertical reef wall coral fish Indonesia","deep coral wall tropical underwater reef"],
  "perhentian-tiga-ruang": ["coral arch underwater tropical Malaysia reef","underwater arch coral fish Malaysia","coral arch fish tropical South China Sea"],
  "perhentian-tokong-laut": ["coral reef fish school Malaysia underwater","tropical reef fish Malaysia South China Sea","staghorn coral reef fish Malaysia underwater"],
  "perhentian-batu-nisan": ["sea turtle coral reef Malaysia tropical underwater","hawksbill turtle reef Malaysia underwater","green sea turtle coral reef tropical Malaysia"],
  "coral-bay-wa-manta-bommie": ["manta ray cleaning station underwater reef","manta ray reef underwater close up blue","oceanic manta ray reef underwater tropical"],
  "coral-bay-wa-five-fingers-reef": ["coral finger reef tropical fish Western Australia","hard coral formation reef fish underwater Australian","coral bommie reef fish tropical underwater warm"],
  "coral-bay-wa-skeleton-bay": ["tiger shark sandy reef underwater","tiger shark reef underwater Australia","shark sandy bottom underwater Western Australia"],
  "coral-bay-wa-labyrinth": ["coral maze reef fish underwater tropical","coral labyrinth reef fish underwater","hard coral formation fish tropical underwater"],
  "exmouth-wa-lighthouse-bay": ["coral reef turtle Western Australia underwater","sea turtle coral reef Northern Australia underwater","coral bommie fish turtle Australian reef underwater"],
  "exmouth-wa-tantabiddi-wall": ["coral wall reef fish Western Australia underwater","whale shark reef Western Australia underwater blue","coral wall fish school tropical Australia underwater"],
  "exmouth-wa-muiron-islands": ["manta ray underwater blue Australian ocean","sea turtle reef Australian underwater coral","coral reef fish Western Australia tropical underwater"],
  "bay-of-islands-nz-hmnzs-canterbury": ["shipwreck underwater New Zealand fish","wreck fish school temperate New Zealand underwater","WWII wreck fish underwater New Zealand"],
  "bay-of-islands-nz-poor-knights-passage": ["kelp forest fish New Zealand underwater","subtropical reef fish school New Zealand","nudibranch temperate reef underwater colorful"],
  "bay-of-islands-nz-te-rawhiti-wall": ["rocky wall reef fish New Zealand underwater","temperate reef wall fish New Zealand","rocky reef wall fish school underwater temperate"],
  "bay-of-islands-nz-hole-in-the-rock": ["sea arch underwater cave fish temperate","underwater arch rock cave fish New Zealand","rock arch cave marine life underwater"],
  "bora-bora-fp-teavanui-pass": ["lemon shark pass French Polynesia underwater","reef shark pass coral drift French Polynesia","blacktip reef shark French Polynesia pass underwater"],
  "bora-bora-fp-anau-coral-garden": ["coral garden tropical French Polynesia underwater","coral bommie reef fish French Polynesia","hard coral garden fish tropical lagoon underwater"],
  "bora-bora-fp-muri-muri": ["eagle ray coral reef underwater tropical Pacific","spotted eagle ray reef underwater tropical","eagle ray French Polynesia underwater reef"],
  "bora-bora-fp-tupitipiti-point": ["grey reef shark French Polynesia underwater","hammerhead shark open water French Polynesia","reef shark current French Polynesia underwater"],
  "fakarava-tetamanu-wall": ["coral wall French Polynesia fish school underwater","vertical coral wall fish tropical Pacific underwater","Napoleon wrasse coral wall underwater French Polynesia"],
  "moorea-tiahura-shark-ray": ["blacktip shark stingray French Polynesia underwater","shark stingray sandy reef French Polynesia underwater","lemon shark stingray lagoon French Polynesia"],
  "moorea-taotoi-pass": ["grey reef shark pass drift French Polynesia","reef shark current underwater French Polynesia","whitetip reef shark drift pass French Polynesia"],
  "moorea-opunohu-canyons": ["coral canyon reef fish French Polynesia underwater","grouper coral canyon tropical underwater","French Polynesia canyon coral reef fish underwater"],
  "moorea-tiki-point": ["coral reef fish French Polynesia tropical underwater","reef fish school French Polynesia coral bommie","parrotfish coral reef French Polynesia underwater"],
  "cartagena-rosario-islands-la-cherna-wall": ["coral wall Caribbean Colombia underwater reef","grouper coral wall Caribbean reef underwater","coral reef wall Caribbean tropical fish underwater"],
  "cartagena-rosario-islands-playa-blanca-reef": ["Caribbean coral reef stingray underwater","southern stingray Caribbean sandy reef underwater","Caribbean reef fish stingray underwater tropical"],
  "manta-ecuador-la-plata-north-wall": ["giant manta ray underwater Pacific Ecuador","manta ray blue Pacific ocean underwater","sea turtle Pacific Ecuador underwater reef"],
  "manta-ecuador-la-plata-south-pinnacle": ["scalloped hammerhead shark school underwater Pacific","hammerhead shark school deep blue underwater","spotted eagle ray school underwater Pacific"],
  "manta-ecuador-bajo-cope": ["silky shark blue water underwater Pacific","oceanic shark open water underwater Pacific","whale shark oceanic Pacific underwater blue"],
  "manta-ecuador-los-ahorcados": ["giant manta ray school underwater Pacific","manta ray school blue water Pacific","manta ray group feeding underwater oceanic"],
  "cabo-san-lucas-pelican-rock": ["angelfish tropical reef Mexico Pacific underwater","porcupinefish coral reef Mexico underwater","moray eel coral reef tropical Pacific underwater"],
  "cabo-san-lucas-gordo-banks": ["scalloped hammerhead shark school deep Pacific","whale shark open ocean Pacific Mexico underwater","oceanic manta ray deep Pacific underwater"],
  "puerto-vallarta-el-morro": ["giant manta ray underwater Pacific Mexico","manta ray reef Pacific Mexico underwater","spotted eagle ray Mexico Pacific underwater"],
  "puerto-vallarta-los-arcos": ["sea turtle Pacific Mexico reef underwater","green sea turtle rocky reef Pacific underwater","hawksbill turtle coral reef Pacific Mexico"],
  "puerto-vallarta-la-corbeteña": ["bull shark school open water Pacific underwater","silky shark offshore Pacific underwater","oceanic shark group Pacific underwater"],
  "vancouver-island-ogden-point-breakwater": ["giant Pacific octopus rocky reef underwater","wolf eel cold water Pacific underwater","lingcod cold water reef Pacific Northwest underwater"],
  "vancouver-island-ten-mile-point": ["giant Pacific octopus cold water underwater","cloud sponge cold water deep Pacific underwater","wolf eel rocky reef Pacific cold water"],
  "vancouver-island-wreck-of-the-hmcs-mackenzie": ["wreck fish cold water Pacific underwater","artificial reef fish cold water Pacific underwater","shipwreck lingcod underwater cold Pacific"],
  "san-juan-islands-turn-island": ["giant Pacific octopus kelp forest underwater","lingcod cold water kelp reef underwater","kelp forest rockfish Pacific Northwest underwater"],
  "san-juan-islands-deadmans-bay": ["wolf eel cold water rocky reef underwater","black rockfish kelp forest Pacific underwater","rockfish kelp cold water Pacific Northwest underwater"],
  "san-juan-islands-eagle-point": ["giant Pacific octopus cold water rocky reef","plumose anemone cold water Pacific underwater","anemone cold water reef Pacific Northwest"],
  "nice-lerin-islands-plateau": ["long-snouted seahorse Mediterranean underwater reef","cuttlefish Mediterranean reef underwater","red scorpionfish Mediterranean rocky reef underwater"],
  "honda-bay-pandan-island-wall": ["Napoleon wrasse coral wall Philippines underwater","barracuda school reef wall Philippines underwater","dogtooth tuna coral reef Philippines underwater"],
  "honda-bay-luli-island-nurse-shark-flats": ["nurse shark resting sandy reef Philippines underwater","nurse shark reef flat tropical Philippines","sea turtle sandy reef Philippines tropical underwater"],
  "siargao-sohoton-jellyfish-lake": ["jellyfish underwater lake tropical Philippines","stingless jellyfish underwater tropical lake","golden jellyfish lake underwater tropical"],
  "siargao-tayangban-cave-pool": ["cave pool underwater fish tropical Philippines","cave shrimp underwater tropical cave","underwater cave pool fish tropical reef"],
  "siargao-daco-island-reef": ["ornate ghost pipefish macro Philippines reef","pygmy seahorse coral Philippines macro reef","blue ring octopus coral reef Philippines macro"],
  "ternate-batu-angus": ["pygmy seahorse black sand Indonesia macro","painted frogfish macro Indonesia reef","ghost pipefish macro black sand Indonesia"],
  "ternate-tomagoba": ["mimic octopus muck dive Indonesia underwater","wunderpus octopus muck Indonesia reef","flamboyant cuttlefish Indonesia muck dive macro"],
  "ternate-kastela-wall": ["whitetip reef shark coral wall Indonesia underwater","Napoleon wrasse coral wall Indonesia reef","coral wall Indonesia reef fish school underwater"],
  "ternate-sulamadaha-point": ["bumphead parrotfish school coral Indonesia reef","eagle ray coral reef Indonesia underwater","bumphead parrotfish school underwater tropical Indonesia"],
  "tufi-cape-nelson-wreck": ["glassfish shipwreck tropical underwater Papua New Guinea","batfish wreck underwater tropical PNG","wreck fish school tropical Papua New Guinea underwater"],
  "tufi-fjord-wall": ["mandarin fish coral reef PNG underwater","pygmy seahorse coral wall Papua New Guinea","Spanish dancer nudibranch underwater tropical reef"],
  "tufi-rainbow-passage": ["dogtooth tuna coral reef PNG underwater","giant grouper coral reef Papua New Guinea underwater","schooling anthias coral reef Papua New Guinea"],
  "tufi-shark-point": ["whitetip reef shark coral Papua New Guinea underwater","grey reef shark tropical reef PNG underwater","hammerhead shark reef Papua New Guinea underwater"],
  "reunion-island-les-avirons-wall": ["bull shark deep water Indian Ocean underwater","Napoleon wrasse coral wall Indian Ocean reef","black coral deep wall Indian Ocean underwater"],
  "reunion-island-la-grande-anse-pinnacles": ["hammerhead shark Indian Ocean underwater reef","humpback whale underwater Indian Ocean","shark pinnacle reef Indian Ocean underwater"],
  "reunion-island-tombant-de-la-possession": ["bull shark reef Indian Ocean underwater","green turtle coral reef Indian Ocean underwater","gorgonian fan coral deep Indian Ocean underwater"],
  "reunion-island-cap-la-houssaye": ["whitetip reef shark coral reef Indian Ocean","lionfish coral reef Indian Ocean underwater","trumpetfish coral reef tropical Indian Ocean underwater"],
  "terceira-azores-baixa-do-sul": ["blue shark Atlantic underwater Azores ocean","mobula ray Atlantic underwater blue ocean","common dolphin underwater Atlantic ocean"],
  "terceira-azores-pico-do-ambrosio": ["blue shark Atlantic ocean underwater open water","bottlenose dolphin underwater blue Atlantic","sperm whale underwater Atlantic deep ocean"],
  "terceira-azores-caverna-das-focas": ["conger eel underwater cave reef Atlantic","cleaner wrasse reef underwater Atlantic","sea bream rocky reef Atlantic underwater"],
  "terceira-azores-ilheu-das-cabras": ["blue shark school Atlantic Azores underwater","salema fish school rocky Atlantic reef underwater","sea bream school rocky reef Atlantic underwater"],
};

await loadRegistry();
const [sites, locs] = await Promise.all([
  fs.readFile(SITES_PATH, "utf8").then(JSON.parse),
  fs.readFile(LOCS_PATH, "utf8").then(JSON.parse),
]);

async function tryQueries(queries) {
  for (const q of queries) {
    const results = await pexelsSearch(q, { perPage: 15 });
    await sleep(300);
    const pick = results.find(r => r.srcWidth >= 2000 && !isUsed(r.url) && !isBlacklisted(r.url));
    if (pick) return { ...pick, query: q };
  }
  return null;
}

let fixed = 0, missed = 0;
const all = [...locs, ...sites];
for (const entity of all) {
  if (entity.heroImageUrl !== null) continue;
  const id = entity.slug || entity.id;
  const queries = TARGETED[id];
  if (!queries) continue;
  const pick = await tryQueries(queries);
  if (pick) {
    entity.heroImageUrl = pick.url;
    markUsed(pick.url, id);
    console.log(`[✓] ${id}`);
    fixed++;
  } else {
    console.log(`[∅] ${id}`);
    missed++;
  }
}

await fs.writeFile(SITES_PATH, JSON.stringify(sites, null, 2) + "\n");
await fs.writeFile(LOCS_PATH, JSON.stringify(locs, null, 2) + "\n");
await saveRegistry();
console.log(`\nFixed: ${fixed}, Missed: ${missed}`);

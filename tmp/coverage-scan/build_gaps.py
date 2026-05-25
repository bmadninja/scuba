#!/usr/bin/env python3
"""Diff competitor coverage vs our sites + locations, prioritize, write coverage-gaps.json."""
import json, re, sys, unicodedata
from collections import defaultdict
sys.path.insert(0, 'tmp/coverage-scan')
from competitor_data import SOURCES, TIER1

REPO_ROOT = '/Users/josietyleung/github/scuba'

GENERIC_TOKENS = {
    'wreck','reef','reefs','fissure','island','islands','atoll','atolls',
    'lagoon','channel','point','bay','cave','caves','cove','hole','sea','park',
    'monument','marine','wall','pinnacle','rock','rocks','national',
    'strait','straits','sound','passage','reserve','sanctuary','grotto',
    'beach','coast','coastline','crater','underwater','sculpture','garden',
}
# Tokens too vague to count as meaningful overlap between a candidate site
# and one of our existing locations.
GENERIC_MATCH_TOKENS = GENERIC_TOKENS | {
    'red','north','south','east','west','great','blue','little','big','new',
    'old','upper','lower','the','of','and','la','el','de','del','los','las',
}
SHIP_PREFIXES = {
    'ss','mv','hms','hmas','hmcs','hmnzs','usns','uscgc','uss','usat','sas','sms',
    'rms','ms','mt','tss','ps','hmt','smk','smns','rfa',
}

def norm(name):
    s = unicodedata.normalize('NFKD', name).encode('ascii','ignore').decode()
    s = s.lower()
    s = re.sub(r"[^\w\s]", ' ', s)
    s = re.sub(r'\s+', ' ', s).strip()
    return s

def norm_stripped(name):
    s = norm(name)
    tokens = [t for t in s.split() if t not in GENERIC_TOKENS and t not in SHIP_PREFIXES]
    return ' '.join(tokens)

def all_forms(name):
    return {norm(name), norm_stripped(name)} - {''}

# Load
sites = json.load(open(f'{REPO_ROOT}/src/data/sites.json'))
locs = json.load(open(f'{REPO_ROOT}/src/data/locations.json'))
loc_by_id = {l['id']: l for l in locs}

site_count_by_loc = defaultdict(int)
for s in sites:
    site_count_by_loc[s.get('locationId','')] += 1

# Build "covered" normalized set: site names + location names where we have ≥1 site
our_site_forms = set()
for s in sites:
    our_site_forms |= all_forms(s['name'])
    m = re.match(r'^([^(]+)\(([^)]+)\)\s*$', s['name'])
    if m:
        our_site_forms |= all_forms(m.group(1))
        our_site_forms |= all_forms(m.group(2))

our_loc_forms = set()
for l in locs:
    if site_count_by_loc.get(l['id'], 0) >= 1:
        our_loc_forms |= all_forms(l['name'])
        if l.get('region'):
            our_loc_forms |= all_forms(l['region'])

# Country site counts
country_counts = defaultdict(int)
for s in sites:
    loc = loc_by_id.get(s.get('locationId',''))
    if loc:
        country_counts[loc['country']] += 1

# Aggregate competitor data
agg = {}
for source, entries in SOURCES.items():
    for name, country, region in entries:
        n_strip = norm_stripped(name)
        if not n_strip:
            continue
        if n_strip not in agg:
            agg[n_strip] = {
                'name': name,
                'aliases': set(),
                'country': country,
                'region': region,
                'sources': set(),
                'tier1Mentions': 0,
            }
        if name != agg[n_strip]['name']:
            agg[n_strip]['aliases'].add(name)
        if not agg[n_strip]['country'] and country:
            agg[n_strip]['country'] = country
        if not agg[n_strip]['region'] and region:
            agg[n_strip]['region'] = region
        agg[n_strip]['sources'].add(source)
        if source in TIER1:
            agg[n_strip]['tier1Mentions'] += 1

def match_our_location(country, region, name=None):
    if not country:
        return None
    candidates = [l for l in locs if l['country'].lower() == country.lower()]
    if not candidates:
        return None
    search_text = ' '.join(filter(None, [name, region])).lower()
    stokens = set(re.findall(r'\w+', search_text)) - GENERIC_MATCH_TOKENS
    best = None
    for l in candidates:
        ln = (l['name'] or '').lower()
        lr = (l.get('region') or '').lower()
        ltokens = (set(re.findall(r'\w+', ln)) |
                   set(re.findall(r'\w+', lr))) - GENERIC_MATCH_TOKENS
        if ltokens & stokens:
            best = l['id']
            break
    if not best and len(candidates) == 1:
        best = candidates[0]['id']
    return best

# Generic-name allowlist to exclude (countries, broad regions, etc.)
EXCLUDE_GENERICS_NORM = {norm_stripped(x) for x in [
    'Palau','Fiji','Bali','Cuba','Australia','New Zealand','Tonga','Vanuatu',
    'Guam','Bermuda','Grenada','Dominica','Aruba','Curaçao','Bonaire','Belize',
    'Galapagos','Galapagos Islands','Maldives','Antarctica','Madagascar',
    'Tobago','Queensland','Florida Keys','Florida','British Columbia','Cancun',
    'Cayman Islands','British Virgin Islands','Cozumel','Tulum',
    'Playa Del Carmen','Pensacola','Mackinac Straits','Morehead City','Carmel',
    'Hawaii','New Providence Island','Red Sea','Red Sea North','Red Sea South',
    'Diving in East Timor','Sudan','Diani','Kenya','Djibouti','Yemen',
    'Hurghada','El Gouna','Safaga','El Quseir','Sharm El Sheikh','Riviera Maya',
    'Boracay','Palawan','Cebu','Okinawa','Honshu','Eilat','Aqaba','Caribbean',
    'Pacific','Indian Ocean','Atlantic','Mediterranean','Bahamas','Egypt',
    'Mexico','Indonesia','Philippines','Thailand','Malaysia','Costa Rica',
    'Honduras','Colombia','Ecuador','Sri Lanka','Tanzania','Mozambique',
    'South Africa','Mauritius','Seychelles','Yucatan','Bohol Sea','Krabi',
    'Phuket','Koh Samui','Borneo','La Paz','Iceland','Sumatra','Pohnpei','Yap',
    'Saudi Arabia','Saba','Italy','Madeira Island','Spain','Croatia','Portugal',
    'Malta','Gozo','Comino','Cape Verde','Norway','Cyprus','Turkey',
    'Trincomalee','Mirissa','Colombo','Andaman Islands','Solomon Islands',
    'Papua New Guinea','French Polynesia','Federated States of Micronesia',
    'Micronesia','Marshall Islands','Tuamotu Islands','Bimini','Donsol',
    'Mafia Island','Pemba Island','Quirimbas Islands','Bazaruto Island',
    'Manado Bay','Banda Sea','British Virgin Islands','Cape Verde',
    'St Eustatius','St. Eustatius','New Providence Island','Queensland',
    'Bonaire',
]}

gaps = []
for k, entry in agg.items():
    # Already covered as a specific site?
    if k in our_site_forms:
        continue
    # Already covered as a destination/location with ≥1 site?
    if k in our_loc_forms:
        continue
    if k in EXCLUDE_GENERICS_NORM:
        continue

    source_count = len(entry['sources'])
    tier1 = entry['tier1Mentions']
    cn = country_counts.get(entry.get('country',''), 0)

    if cn == 0:
        region_bonus = 25
    elif cn <= 2:
        region_bonus = 12
    elif cn <= 4:
        region_bonus = 5
    else:
        region_bonus = 0

    priority = source_count * 15 + tier1 * 10 + region_bonus
    matched_loc = match_our_location(entry['country'], entry['region'], entry['name'])
    src_list = sorted(entry['sources'], key=lambda s: (s not in TIER1, s))

    if source_count >= 5:
        notes_base = f"Cited by {source_count} competitor lists ({tier1} Tier-1)."
    elif tier1 >= 1:
        notes_base = f"Tier-1 mention ({source_count} sources)."
    else:
        notes_base = f"{source_count} competitor mention(s)."
    region_note = (f" We have {cn} site(s) in {entry['country']}."
                   if entry['country'] else '')

    gaps.append({
        'name': entry['name'],
        'aliases': sorted(entry['aliases']),
        'country': entry['country'],
        'region': entry['region'],
        'lat': None,
        'lng': None,
        'sources': src_list,
        'sourceCount': source_count,
        'tier1Mentions': tier1,
        'ourLocationId': matched_loc,
        'priority': priority,
        'notes': notes_base + region_note,
    })

gaps.sort(key=lambda g: (-g['priority'], -g['sourceCount'], g['name'].lower()))
top = gaps[:100]

out_path = f'{REPO_ROOT}/src/data/coverage-gaps.json'
with open(out_path, 'w') as f:
    json.dump(top, f, indent=2, ensure_ascii=False)

print(f'Wrote {len(top)} gaps to {out_path}')
print(f'Total candidate gaps before truncation: {len(gaps)}')
print(f'Source count: {len(SOURCES)} competitor sources')
print()
print('Top 40 gaps:')
for g in top[:40]:
    matched = g['ourLocationId'] or '—'
    print(f"  {g['priority']:4d}  [{g['sourceCount']}sr/{g['tier1Mentions']}t1]  "
          f"{g['name']:38s}  {g['country']:18s}  ({g['region']}) → {matched}")

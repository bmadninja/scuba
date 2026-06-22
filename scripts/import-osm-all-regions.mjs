#!/usr/bin/env node
import fs from 'fs'

console.log('[1/4] Loading data...')
const locations = JSON.parse(fs.readFileSync('./src/data/locations.json', 'utf8'))
const sites = JSON.parse(fs.readFileSync('./src/data/sites.json', 'utf8'))

console.log(`Starting: ${locations.length} locations, ${sites.length} sites`)

const existingSiteNames = new Set()
sites.forEach((s) => {
  existingSiteNames.add(`${s.locationId}:${s.name.toLowerCase()}`)
})

function distance(lat1, lon1, lat2, lon2) {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 50)
}

const regions = [
  { name: 'Southeast Asia', bbox: '-10,95,10,141' },
  { name: 'Pacific Islands', bbox: '-20,160,20,200' },
  { name: 'Caribbean', bbox: '10,-85,27,-60' },
  { name: 'Red Sea', bbox: '12,32,30,42' },
  { name: 'Indo-Pacific', bbox: '-35,110,-5,155' },
  { name: 'Mediterranean', bbox: '30,-6,45,42' },
  { name: 'Australia/NZ', bbox: '-45,113,-8,155' },
  { name: 'Hawaii/Central Pacific', bbox: '18,-161,23,-154' },
  { name: 'Fiji/Samoa', bbox: '-19,-181,-16,-177' },
]

let totalImported = 0
let totalDeduped = 0
const newSites = []

console.log(`[2/4] Querying ${regions.length} regions from Overpass...`)

async function importRegion(region) {
  const queries = [
    `[out:json][bbox:${region.bbox}];(node["tourism"="diving_school"];node["sport"="scuba_diving"];);out center;`,
    `[out:json][bbox:${region.bbox}];(way["tourism"="diving_school"];way["sport"="scuba_diving"];);out center;`,
  ]

  for (const query of queries) {
    try {
      const response = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'ScubaSeasonBot/1.0 (+https://scubaseason.fun)',
        },
        body: `data=${encodeURIComponent(query)}`,
      })

      if (!response.ok) {
        console.log(`  ${region.name}: HTTP ${response.status}`)
        continue
      }

      const data = await response.json()
      if (!data.elements || data.elements.length === 0) continue

      let regionImported = 0
      let regionDeduped = 0

      data.elements.forEach((elem) => {
        const osmName = elem.tags?.name || elem.tags?.operator || 'Unnamed'
        const osmLat = elem.lat || elem.center?.lat
        const osmLng = elem.lon || elem.center?.lon

        if (!osmLat || !osmLng) return

        let closest = null
        let closestDist = 50

        for (const loc of locations) {
          const d = distance(osmLat, osmLng, loc.lat, loc.lng)
          if (d < closestDist) {
            closestDist = d
            closest = loc
          }
        }

        if (!closest) return

        const dupKey = `${closest.id}:${osmName.toLowerCase()}`
        if (existingSiteNames.has(dupKey)) {
          regionDeduped++
          return
        }

        const slug = slugify(`${osmName}-osm-${Math.random().toString(36).slice(2, 8)}`)
        const site = {
          id: slug,
          slug,
          locationId: closest.id,
          name: osmName,
          lat: Math.round(osmLat * 1000) / 1000,
          lng: Math.round(osmLng * 1000) / 1000,
          description: `Dive site near ${closest.name}.`,
          depthRange: { min: 5, max: 30 },
          skillLevel: 'intermediate',
          diveTypes: [],
          species: [],
          conditionsByMonth: Array(12).fill('variable'),
          bestMonths: [],
          editorialRank: 0,
          getThere: '',
          operators: elem.tags?.operator ? [elem.tags.operator] : [],
          gearIds: [],
          siteSpecificGear: [],
          notes: `From OpenStreetMap. ${closestDist.toFixed(1)}km from ${closest.name}.`,
          heroImageUrl: closest.heroImageUrl,
          photography: elem.tags?.website ? [elem.tags.website] : [],
        }

        newSites.push(site)
        existingSiteNames.add(dupKey)
        regionImported++
      })

      if (regionImported > 0) {
        totalImported += regionImported
        totalDeduped += regionDeduped
        console.log(`  ${region.name}: +${regionImported} sites (${regionDeduped} deduped)`)
      }

      await new Promise((r) => setTimeout(r, 500))
    } catch (err) {
      console.log(`  ${region.name}: ${err.message}`)
    }
  }
}

for (const region of regions) {
  await importRegion(region)
}

console.log(`\n[3/4] Saving ${totalImported} new sites...`)
const merged = [...sites, ...newSites]
fs.writeFileSync('./src/data/sites.json', JSON.stringify(merged, null, 2))

// Update location siteIds
const sitesByLoc = new Map()
merged.forEach((s) => {
  if (!sitesByLoc.has(s.locationId)) {
    sitesByLoc.set(s.locationId, [])
  }
  sitesByLoc.get(s.locationId).push(s.id)
})

locations.forEach((loc) => {
  loc.siteIds = sitesByLoc.get(loc.id) || []
})

fs.writeFileSync('./src/data/locations.json', JSON.stringify(locations, null, 2))

console.log(`[4/4] Done!\n`)
console.log(`=== SUMMARY ===`)
console.log(`Sites before: ${sites.length}`)
console.log(`Sites imported: +${totalImported}`)
console.log(`Sites deduped: ${totalDeduped}`)
console.log(`Sites now: ${merged.length}`)
console.log(`Progress to 4K: ${merged.length}/4000 (${Math.round((merged.length / 4000) * 100)}%)`)

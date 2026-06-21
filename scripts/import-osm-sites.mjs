#!/usr/bin/env node
import fs from 'fs'

console.log('OSM importer starting...')

// Use native fetch (Node 18+) or node-fetch fallback
const fetchFn = globalThis.fetch || (await import('node-fetch')).default

// Haversine distance in km
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

// Generate slug from name
function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

// Load existing data
const locations = JSON.parse(fs.readFileSync('./src/data/locations.json', 'utf8'))
const sites = JSON.parse(fs.readFileSync('./src/data/sites.json', 'utf8'))

// Build spatial index
const locIndex = new Map()
locations.forEach((loc) => {
  locIndex.set(loc.id, loc)
})

// Track existing site names per location (dedup)
const existingSiteNames = new Set()
sites.forEach((s) => {
  existingSiteNames.add(`${s.locationId}:${s.name.toLowerCase()}`)
})

// Query Overpass for scuba diving sites
// Limit to bbox queries to avoid timeout (done in chunks)
const regions = [
  { name: 'Southeast Asia', bbox: '-10.5,95,10,141' },
  { name: 'Pacific', bbox: '-20,160,20,200' },
  { name: 'Caribbean', bbox: '10,-85,27,-60' },
  { name: 'Red Sea', bbox: '12,32,30,42' },
  { name: 'Indo-Pacific', bbox: '-35,110,-5,155' },
  { name: 'Mediterranean', bbox: '30,-6,45,42' },
  { name: 'Australia', bbox: '-45,113,-8,155' },
  { name: 'Hawaii', bbox: '18,-161,23,-154' },
  { name: 'Fiji', bbox: '-19,-181,-16,-177' },
]

const overpassUrl = 'https://overpass-api.de/api/interpreter'
const newSites = []
const log = []

log.push(`Starting OSM import. Current sites: ${sites.length}`)
log.push(`Existing locations: ${locations.length}`)

// Import counter
let imported = 0
let deduped = 0
let noMatch = 0

async function fetchOsmSites() {
  for (const region of regions) {
    log.push(`\nFetching ${region.name} (bbox ${region.bbox})...`)

    // Query for diving schools and scuba diving sites
    const queries = [
      `[bbox:${region.bbox}];(node["tourism"="diving_school"];node["sport"="scuba_diving"];);out center;`,
      `[bbox:${region.bbox}];(way["tourism"="diving_school"];way["sport"="scuba_diving"];);out center;`,
    ]

    for (const query of queries) {
      try {
        log.push(`  Querying Overpass...`)
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 30000)

        const response = await fetchFn(overpassUrl, {
          method: 'POST',
          body: query,
          signal: controller.signal,
        })
        clearTimeout(timeout)

        if (!response.ok) {
          log.push(`  Warning: HTTP ${response.status}`)
          continue
        }

        const data = await response.json()

        if (!data.elements) {
          log.push(`  No elements in response`)
          continue
        }

        // Process each OSM site
        data.elements.forEach((elem) => {
          const osmName = elem.tags?.name || elem.tags?.operator || 'Unnamed'
          const osmLat = elem.lat || elem.center?.lat
          const osmLng = elem.lon || elem.center?.lon

          if (!osmLat || !osmLng) return

          // Find closest location within 50km
          let closestLoc = null
          let closestDist = 50

          for (const loc of locations) {
            const d = distance(osmLat, osmLng, loc.lat, loc.lng)
            if (d < closestDist) {
              closestDist = d
              closestLoc = loc
            }
          }

          if (!closestLoc) {
            noMatch++
            return
          }

          // Check for duplicate
          const dupKey = `${closestLoc.id}:${osmName.toLowerCase()}`
          if (existingSiteNames.has(dupKey)) {
            deduped++
            return
          }

          // Create new site
          const slug = slugify(`${osmName}-osm-${osmLat.toFixed(3)}-${osmLng.toFixed(3)}`)
          const site = {
            id: slug,
            slug,
            locationId: closestLoc.id,
            name: osmName,
            lat: Math.round(osmLat * 1000) / 1000,
            lng: Math.round(osmLng * 1000) / 1000,
            description: elem.tags?.description || `Dive site near ${closestLoc.name}. Learn more at openstreetmap.org.`,
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
            notes: `Imported from OpenStreetMap. ${closestDist.toFixed(1)}km from ${closestLoc.name}.`,
            heroImageUrl: closestLoc.heroImageUrl,
            photography: elem.tags?.website ? [elem.tags.website] : [],
          }

          newSites.push(site)
          existingSiteNames.add(dupKey)
          imported++
        })

        log.push(`  Found and processed region`)
        // Rate limit
        await new Promise((r) => setTimeout(r, 1000))
      } catch (err) {
        log.push(`  Error: ${err.message}`)
      }
    }
  }
}

// Main
await fetchOsmSites()

// Merge and save
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

log.push(`\n=== SUMMARY ===`)
log.push(`Total sites now: ${merged.length} (was ${sites.length})`)
log.push(`New sites imported: ${imported}`)
log.push(`Deduplicated: ${deduped}`)
log.push(`No location match: ${noMatch}`)

console.log(log.join('\n'))

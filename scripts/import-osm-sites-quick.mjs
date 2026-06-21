#!/usr/bin/env node
import fs from 'fs'

console.log('[1/5] Loading data...')
const locations = JSON.parse(fs.readFileSync('./src/data/locations.json', 'utf8'))
const sites = JSON.parse(fs.readFileSync('./src/data/sites.json', 'utf8'))

console.log(`[2/5] Current state: ${locations.length} locations, ${sites.length} sites`)

// Build dedup set
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
}

console.log('[3/5] Testing Overpass API...')

const testQuery = `[out:json][bbox:-10,95,10,141];(node["tourism"="diving_school"];node["sport"="scuba_diving"];);out center;`
const overpassUrl = 'https://overpass-api.de/api/interpreter'

try {
  const response = await fetch(overpassUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'ScubaSeasonBot/1.0 (+https://scubaseason.fun)',
    },
    body: `data=${encodeURIComponent(testQuery)}`,
  })

  console.log(`[4/5] Response status: ${response.status}`)

  if (!response.ok) {
    console.error(`Error: HTTP ${response.status}`)
    process.exit(1)
  }

  const data = await response.json()
  console.log(`[5/5] Got ${data.elements?.length || 0} elements from OSM`)

  if (!data.elements || data.elements.length === 0) {
    console.log('No results from Overpass. API may be overloaded or no diving schools in region.')
    process.exit(0)
  }

  let imported = 0
  let deduped = 0
  const newSites = []

  data.elements.forEach((elem) => {
    const osmName = elem.tags?.name || elem.tags?.operator || 'Unnamed'
    const osmLat = elem.lat || elem.center?.lat
    const osmLng = elem.lon || elem.center?.lon

    if (!osmLat || !osmLng) return

    // Find closest location
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
      deduped++
      return
    }

    const slug = slugify(`${osmName}-osm`)
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
      notes: `Imported from OpenStreetMap. ${closestDist.toFixed(1)}km from ${closest.name}.`,
      heroImageUrl: closest.heroImageUrl,
      photography: elem.tags?.website ? [elem.tags.website] : [],
    }

    newSites.push(site)
    existingSiteNames.add(dupKey)
    imported++
  })

  console.log(`\n=== RESULT ===`)
  console.log(`Imported: ${imported}`)
  console.log(`Deduplicated: ${deduped}`)

  if (imported > 0) {
    const merged = [...sites, ...newSites]
    fs.writeFileSync('./src/data/sites.json', JSON.stringify(merged, null, 2))
    console.log(`Saved to sites.json. Total now: ${merged.length}`)
  }
} catch (err) {
  console.error(`Error: ${err.message}`)
  process.exit(1)
}

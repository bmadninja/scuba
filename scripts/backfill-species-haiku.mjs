#!/usr/bin/env node
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

// Load .env.local
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const envFile = path.join(__dirname, '..', '.env.local')
if (fs.existsSync(envFile)) {
  const envContent = fs.readFileSync(envFile, 'utf8')
  envContent.split('\n').forEach((line) => {
    const [key, ...valueParts] = line.split('=')
    if (key && !key.startsWith('#') && valueParts.length > 0) {
      process.env[key.trim()] = valueParts.join('=').trim()
    }
  })
}

import Anthropic from '@anthropic-ai/sdk'

if (!process.env.ANTHROPIC_API_KEY) {
  console.error('Error: ANTHROPIC_API_KEY not found in .env.local or environment')
  process.exit(1)
}

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

console.log('[1/4] Loading data...')
const locations = JSON.parse(fs.readFileSync('./src/data/locations.json', 'utf8'))
const sites = JSON.parse(fs.readFileSync('./src/data/sites.json', 'utf8'))

// Find sites missing species
const sitesNeedingSpecies = sites.filter(
  (s) => !s.species || s.species.length === 0
)

console.log(`Found ${sitesNeedingSpecies.length} sites needing species`)
console.log(`[2/4] Backfilling species via Haiku...`)

// Group by location for context
const sitesByLocation = new Map()
sites.forEach((s) => {
  if (!sitesByLocation.has(s.locationId)) {
    sitesByLocation.set(s.locationId, [])
  }
  sitesByLocation.get(s.locationId).push(s)
})

let processed = 0
let succeeded = 0

async function backfillSite(site) {
  const location = locations.find((l) => l.id === site.locationId)
  if (!location) return null

  // Get example species from nearby sites in same location
  const siblingSites = (sitesByLocation.get(site.locationId) || [])
    .filter((s) => s.species && s.species.length > 0)
    .slice(0, 2)

  const exampleSpecies = siblingSites
    .flatMap((s) => s.species.slice(0, 3))
    .map((sp) => `${sp.commonName} (${sp.scientificName})`)
    .join(', ')

  const prompt = `You are a marine biology expert helping a dive site database.

Location: ${location.name}, ${location.country}
Site: ${site.name}
Description: ${site.description}
Depth: ${site.depthRange.min}-${site.depthRange.max}m
Dive Types: ${site.diveTypes.join(', ')}

${exampleSpecies ? `Similar nearby sites have: ${exampleSpecies}` : ''}

Suggest 6-10 common species likely seen at this dive site. For each, provide:
1. Common name
2. Scientific name
3. Reliability: "year-round" or "seasonal"
4. Best months (1-12, comma separated, or empty if year-round)

Format as JSON:
[
  {
    "commonName": "species name",
    "scientificName": "genus species",
    "reliability": "year-round|seasonal",
    "bestMonths": [1,2,3] or []
  }
]

Include mix of fish, coral, invertebrates, and megafauna if appropriate.`

  try {
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 800,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    const jsonMatch = text.match(/\[[\s\S]*\]/)
    if (!jsonMatch) {
      console.log(`  ${site.name}: no JSON in response`)
      return null
    }

    const speciesArray = JSON.parse(jsonMatch[0])

    // Enrich with iNat obs counts and monthly probability
    const enriched = speciesArray.map((sp) => ({
      commonName: sp.commonName,
      reliability: sp.reliability || 'seasonal',
      scientificName: sp.scientificName,
      inatObsCount: 0, // Will be 0 until real iNat data available
      monthlyObs: Array(12).fill(0),
      monthlyProbability: Array(12)
        .fill(0)
        .map((_, i) => (sp.bestMonths && sp.bestMonths.includes(i + 1) ? 0.4 : 0.1)),
      bestMonths: sp.bestMonths || [],
    }))

    return enriched
  } catch (err) {
    console.log(`  ${site.name}: ${err.message}`)
    return null
  }
}

// Process in batches to avoid rate limits
const batchSize = 5
for (let i = 0; i < sitesNeedingSpecies.length; i += batchSize) {
  const batch = sitesNeedingSpecies.slice(i, i + batchSize)
  const results = await Promise.all(batch.map(backfillSite))

  results.forEach((species, idx) => {
    const site = batch[idx]
    if (species) {
      site.species = species
      succeeded++
    }
    processed++
    if (processed % 10 === 0) {
      console.log(`  Processed ${processed}/${sitesNeedingSpecies.length}`)
    }
  })

  // Rate limit
  if (i + batchSize < sitesNeedingSpecies.length) {
    await new Promise((r) => setTimeout(r, 500))
  }
}

console.log(`[3/4] Saving ${succeeded} backfilled sites...`)
fs.writeFileSync('./src/data/sites.json', JSON.stringify(sites, null, 2))

console.log(`[4/4] Done!\n`)
console.log(`=== SUMMARY ===`)
console.log(`Sites processed: ${processed}`)
console.log(`Successfully backfilled: ${succeeded}`)
console.log(`Sites with species now: ${sites.filter((s) => s.species && s.species.length > 0).length}/${sites.length}`)

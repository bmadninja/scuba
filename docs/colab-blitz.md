# Colab Gemini Blitz

Use this to run the dive-site discovery blitz from Google Colab with Google AI Studio credits instead of local/cloud ChatGPT sessions.

## Colab Secrets

In the Colab secrets sidebar, add:

- `GOOGLE_API_KEY` or `GEMINI_API_KEY`: your Google AI Studio API key
- `GITHUB_TOKEN` or `GH_TOKEN`: GitHub token with write access to `bmadninja/scuba`

## Notebook Setup

1. Open a new Colab notebook.
2. Open `scripts/colab_blitz.py`.
3. Paste the script into Colab as separate cells at the `CELL` markers.
4. Run Cell 1 to install dependencies.
5. In Cell 2, set one worker:

```python
WORKER = "indo-pacific"
```

6. Run the remaining definition cells.
7. Run Cell 6:

```python
blitz(max_sites=500, delay=30)
```

If Colab shows dependency warnings after an older install cell, run this once,
then restart the runtime:

```python
!pip install "google-auth==2.47.0" "requests==2.32.4" "google-genai>=1.66,<2.0.0" -q
```

## Parallel Tabs

For the old three-way split, use three Colab notebook copies or three separate runtimes:

- Tab/runtime 1: `WORKER = "indo-pacific"`
- Tab/runtime 2: `WORKER = "americas-atlantic"`
- Tab/runtime 3: `WORKER = "indian-med-africa"`

Start them 20-60 seconds apart. Each runtime pulls before every iteration, appends one site through the guarded `append_site` tool, merges that one site onto latest `origin/main`, then commits and pushes.

## Bundled records per site

Every new site must ship with the data the site-detail and reef-health UI need to render:

- **1 site** via `append_site` (as before).
- **≥1 sighting evidence** via `append_sighting` — one per headline species the site is famous for, keyed to the new site's `siteId`. Use `sourceIds` from `src/data/sources.json` (e.g. `gbif`, `obis`, `manta-trust`) and `methodologyClaimIds: ["sighting-occurrence-cluster"]`.
- **Reef-health record** via `append_reef_health` — only when the site's `locationId` has no record yet. The `append_site` tool response tells the model whether it's needed. Use `sourceIds` like `noaa-crw`, `aims-ltmp`, `reef-check`, and `methodologyClaimIds: ["reef-health-aims-noaa"]`.

`DONE:` is rejected by the runtime until the bundle is complete, and the commit message will read e.g. `auto: add Lizard Island (+ 2 sightings, reef-health)`.

## Stop / Resume

Stop a run by interrupting the Colab cell. To resume, run Cell 6 again. The script resets to `origin/main` before each iteration and skips targets already present in `src/data/sites.json`.

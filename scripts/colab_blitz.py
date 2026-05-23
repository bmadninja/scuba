"""
scubaseason.fun — Dive Site Discovery Blitz
Google Colab script — uses Anthropic API (not your Max plan)

SETUP (run once):
  1. Add secrets in Colab sidebar (🔑 icon):
       ANTHROPIC_API_KEY  →  sk-ant-...
       GITHUB_TOKEN       →  github_pat_... (needs repo write access)
  2. Run Cell 1 (install), then Cell 2 (config), then Cell 3 (blitz).

COST: ~$0.10–0.30 per site using claude-sonnet-4-5.
      At 1 site per iteration and 2 min/iter → ~$5–15 for an overnight run.
"""

# ─── CELL 1: Install dependencies ─────────────────────────────────────────────
# Paste this cell and run it first.

# !pip install anthropic duckduckgo-search html2text gitpython -q


# ─── CELL 2: Config ───────────────────────────────────────────────────────────
# Fill in once, then run the blitz cell below.

import os
import json
import time
import subprocess
import re
import textwrap
from pathlib import Path

import anthropic
import html2text
import requests
from duckduckgo_search import DDGS

try:
    from google.colab import userdata
    ANTHROPIC_API_KEY = userdata.get("ANTHROPIC_API_KEY")
    GITHUB_TOKEN      = userdata.get("GITHUB_TOKEN")
except Exception:
    # If running locally or secrets not set, fall back to env vars
    ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY", "")
    GITHUB_TOKEN      = os.environ.get("GITHUB_TOKEN", "")

GITHUB_REPO   = "bmadninja/scuba"
MODEL         = "claude-sonnet-4-5"   # cheap + capable; swap to claude-opus-4-5 for higher quality
MAX_SITES     = 500                   # safety cap
DELAY_SECONDS = 30                    # pause between iterations
REPO_DIR      = Path("/content/scuba")

client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)
h2t    = html2text.HTML2Text()
h2t.ignore_links = False
h2t.body_width   = 0


# ─── CELL 3: Tool implementations ────────────────────────────────────────────

def web_search(query: str, max_results: int = 8) -> str:
    """DuckDuckGo search — no API key needed."""
    try:
        with DDGS() as ddgs:
            results = list(ddgs.text(query, max_results=max_results))
        if not results:
            return "No results found."
        lines = []
        for r in results:
            lines.append(f"### {r.get('title', '')}\n{r.get('href', '')}\n{r.get('body', '')}\n")
        return "\n".join(lines)
    except Exception as e:
        return f"Search error: {e}"


def web_fetch(url: str, max_chars: int = 12000) -> str:
    """Fetch a URL and return readable text."""
    try:
        resp = requests.get(url, timeout=15, headers={"User-Agent": "Mozilla/5.0"})
        resp.raise_for_status()
        ct = resp.headers.get("content-type", "")
        if "html" in ct:
            text = h2t.handle(resp.text)
        else:
            text = resp.text
        return text[:max_chars]
    except Exception as e:
        return f"Fetch error: {e}"


def git_pull():
    subprocess.run(
        ["git", "pull", "--rebase", "--autostash", "--quiet"],
        cwd=REPO_DIR, capture_output=True
    )


def git_commit_push(site_name: str) -> bool:
    """Stage sites.json, commit, push. Returns True on success."""
    for attempt in range(3):
        try:
            git_pull()
            subprocess.run(
                ["git", "add", "src/data/sites.json"],
                cwd=REPO_DIR, check=True, capture_output=True
            )
            result = subprocess.run(
                ["git", "diff", "--cached", "--quiet"],
                cwd=REPO_DIR
            )
            if result.returncode == 0:
                return False  # nothing to commit — site was already there

            subprocess.run(
                ["git", "commit", "-m", f"auto: add {site_name}"],
                cwd=REPO_DIR, check=True, capture_output=True
            )
            push = subprocess.run(
                ["git", "push"],
                cwd=REPO_DIR, capture_output=True
            )
            if push.returncode == 0:
                return True
            # Push failed (race) — rebase and retry
            subprocess.run(
                ["git", "pull", "--rebase", "--autostash"],
                cwd=REPO_DIR, capture_output=True
            )
            subprocess.run(["git", "push"], cwd=REPO_DIR, capture_output=True)
            return True
        except Exception as e:
            print(f"  git error (attempt {attempt+1}): {e}")
            time.sleep(5)
    return False


TOOL_DEFS = [
    {
        "name": "web_search",
        "description": "Search the web for information about a dive site.",
        "input_schema": {
            "type": "object",
            "properties": {
                "query": {"type": "string", "description": "Search query"}
            },
            "required": ["query"]
        }
    },
    {
        "name": "web_fetch",
        "description": "Fetch a URL and return its text content.",
        "input_schema": {
            "type": "object",
            "properties": {
                "url": {"type": "string", "description": "URL to fetch"}
            },
            "required": ["url"]
        }
    },
    {
        "name": "read_file",
        "description": "Read a file from the local repo.",
        "input_schema": {
            "type": "object",
            "properties": {
                "path": {"type": "string", "description": "Relative path from repo root"}
            },
            "required": ["path"]
        }
    },
    {
        "name": "write_file",
        "description": "Write content to a file in the local repo.",
        "input_schema": {
            "type": "object",
            "properties": {
                "path": {"type": "string", "description": "Relative path from repo root"},
                "content": {"type": "string", "description": "File content"}
            },
            "required": ["path", "content"]
        }
    }
]


def run_tool(name: str, inputs: dict) -> str:
    if name == "web_search":
        return web_search(inputs["query"])
    elif name == "web_fetch":
        return web_fetch(inputs["url"])
    elif name == "read_file":
        try:
            return (REPO_DIR / inputs["path"]).read_text()
        except Exception as e:
            return f"Read error: {e}"
    elif name == "write_file":
        try:
            p = REPO_DIR / inputs["path"]
            p.parent.mkdir(parents=True, exist_ok=True)
            p.write_text(inputs["content"])
            return f"Written {p}"
        except Exception as e:
            return f"Write error: {e}"
    return f"Unknown tool: {name}"


# ─── CELL 4: Discovery prompt ─────────────────────────────────────────────────

DISCOVER_PROMPT = textwrap.dedent("""
You are autonomously adding dive sites to scubaseason.fun. Complete this task fully without asking questions.

## Your job
1. Read `src/data/sites.json` and `src/data/locations.json` using the read_file tool.
2. If `src/data/coverage-gaps.json` exists (read it), prefer picks from there — sites competitors cover that we don't.
3. Otherwise pick the most editorially important missing dive site (famous, highly-searched, from a location with 0-1 sites).
4. Research it using web_search and web_fetch tools — find depth, coordinates, species, conditions, AND a great hero image.
5. Add it to `src/data/sites.json` by reading the file, appending the new entry, and writing it back.

## Schema (append to the JSON array — match this exactly)
```json
{
  "id": "locationId-site-slug",
  "slug": "locationId-site-slug",
  "locationId": "must-match-an-id-from-locations.json",
  "name": "Site Name",
  "heroImageUrl": "https://upload.wikimedia.org/wikipedia/commons/X/XX/Filename.jpg or null",
  "lat": 0.0,
  "lng": 0.0,
  "description": "80-800 chars. Concrete, evocative, factual. No fluff words like 'paradise'.",
  "depthRange": { "min": 5, "max": 30 },
  "skillLevel": "open-water|advanced|tech|never-dived",
  "diveTypes": ["coral|large-pelagics|wrecks|macro|geology"],
  "species": [
    { "commonName": "Name", "scientificName": "Optional", "reliability": "year-round|seasonal|rare", "bestMonths": [1,2,3] }
  ],
  "conditionsByMonth": [
    { "month": 1, "waterTempC": {"min": 26, "max": 29}, "visibilityM": {"min": 15, "max": 25}, "currentStrength": "none|mild|moderate|strong", "suitRecommendation": "Tropical wetsuit" }
  ],
  "bestMonths": [1,2,3],
  "editorialRank": 85,
  "getThere": "Nearest airport(s) and how to get to the dive site.",
  "lodging": [],
  "operators": [],
  "gearIds": [],
  "siteSpecificGear": [],
  "notes": "Permits, hazards, access info or null"
}
```

## Rules
- conditionsByMonth MUST have exactly 12 entries (months 1-12).
- description: NO "paradise", "unforgettable", "pristine" — be specific.
- Verify facts from at least 2-3 sources before writing.
- Do NOT add a site already in sites.json (check by name and coordinates).
- After writing sites.json, output the site name on a line starting with DONE:

## Hero image — spend real effort here
1. **High resolution** — minimum 1600 px on the long edge. Prefer 3000+ px. Skip thumbnails.
2. **Site-specific** — shows the actual wreck/pinnacle/animal/feature this site is famous for. NOT a generic species photo from a different ocean.
3. **Iconic shot** — the image most associated with this site in dive magazines or Wikipedia.
4. **Wikimedia Commons only** — use the full-resolution direct URL: `https://upload.wikimedia.org/wikipedia/commons/X/XX/Filename.jpg`

Selection process:
- web_search "site:commons.wikimedia.org <site name>" and "<site signature feature>"
- web_fetch the Wikipedia article for this site — its lead image is often the canonical shot
- web_fetch a Wikimedia Commons search: `https://commons.wikimedia.org/w/index.php?search=<site+name>&ns6=1`
- Compare 3+ candidates. The subject MUST match what the site is famous for.
- Use the full-resolution URL, NOT the thumb URL.
- If no site-specific high-quality image exists on Commons, set heroImageUrl: null.

## When done
Print exactly: DONE: <site name> added successfully
If all famous sites in this region are already covered: EXHAUSTED
""").strip()


# ─── CELL 5: Blitz loop ────────────────────────────────────────────────────────

def run_one_discovery() -> tuple[str, str]:
    """
    Run one discovery iteration. Returns (status, site_name).
    status: "done" | "exhausted" | "error"
    """
    messages = [{"role": "user", "content": DISCOVER_PROMPT}]

    for turn in range(40):  # max tool-use turns
        response = client.messages.create(
            model=MODEL,
            max_tokens=8192,
            tools=TOOL_DEFS,
            messages=messages,
        )

        # Collect assistant message
        messages.append({"role": "assistant", "content": response.content})

        # Check for terminal signals in text blocks
        for block in response.content:
            if block.type == "text":
                text = block.text
                if m := re.search(r"^DONE:\s*(.+)$", text, re.MULTILINE):
                    return "done", m.group(1).strip()
                if re.search(r"^EXHAUSTED", text, re.MULTILINE):
                    return "exhausted", ""

        # If no more tool calls, we're done
        if response.stop_reason == "end_turn":
            break

        if response.stop_reason != "tool_use":
            break

        # Execute all tool calls
        tool_results = []
        for block in response.content:
            if block.type == "tool_use":
                print(f"  → {block.name}({json.dumps(block.input)[:120]})")
                result = run_tool(block.name, block.input)
                tool_results.append({
                    "type": "tool_result",
                    "tool_use_id": block.id,
                    "content": result[:8000],  # truncate large responses
                })

        messages.append({"role": "user", "content": tool_results})

    return "error", "no DONE/EXHAUSTED signal emitted"


def blitz(max_sites: int = MAX_SITES, delay: int = DELAY_SECONDS):
    # Clone repo if not already present
    if not REPO_DIR.exists():
        token_url = f"https://{GITHUB_TOKEN}@github.com/{GITHUB_REPO}.git"
        print(f"Cloning {GITHUB_REPO}...")
        subprocess.run(["git", "clone", token_url, str(REPO_DIR)], check=True)
        # Set git identity for commits
        subprocess.run(["git", "config", "user.email", "blitz@scubaseason.fun"], cwd=REPO_DIR)
        subprocess.run(["git", "config", "user.name", "ScubaSeason Blitz"], cwd=REPO_DIR)
        # Embed token so push works without re-auth
        subprocess.run(
            ["git", "remote", "set-url", "origin", token_url],
            cwd=REPO_DIR
        )
    else:
        git_pull()

    added        = 0
    exhausted_ct = 0
    start        = time.time()

    print(f"\n{'='*60}")
    print(f"Blitz started | model={MODEL} | max={max_sites}")
    sites_now = len(json.loads((REPO_DIR / "src/data/sites.json").read_text()))
    print(f"Sites at start: {sites_now}")
    print(f"{'='*60}\n")

    for i in range(1, max_sites + 1):
        git_pull()
        sites_now = len(json.loads((REPO_DIR / "src/data/sites.json").read_text()))
        print(f"── iter {i} | added={added} | total={sites_now} | {time.strftime('%H:%M:%S')} ──")

        try:
            status, site = run_one_discovery()
        except anthropic.RateLimitError:
            print("  Rate limited — sleeping 60s")
            time.sleep(60)
            continue
        except anthropic.APIStatusError as e:
            print(f"  API error: {e.status_code} — sleeping 30s")
            time.sleep(30)
            continue

        if status == "done":
            ok = git_commit_push(site)
            if ok:
                print(f"  ✓ Pushed: {site}")
                added += 1
                exhausted_ct = 0
            else:
                print(f"  ✗ Commit failed or duplicate: {site}")
        elif status == "exhausted":
            print("  → Exhausted — no more sites found")
            exhausted_ct += 1
            if exhausted_ct >= 3:
                print("3 consecutive EXHAUSTED — stopping.")
                break
        else:
            print(f"  ✗ {site}")

        elapsed = int(time.time() - start)
        print(f"  [{elapsed//60}m elapsed]\n")
        time.sleep(delay)

    print(f"\n{'='*60}")
    elapsed = int(time.time() - start)
    print(f"Blitz done | added={added} | {elapsed//60}m elapsed")
    sites_final = len(json.loads((REPO_DIR / "src/data/sites.json").read_text()))
    print(f"Total sites now: {sites_final}")
    print(f"{'='*60}")


# ─── CELL 6: Run ──────────────────────────────────────────────────────────────
# Paste this cell last and run it to start the blitz.

# blitz(max_sites=500, delay=30)

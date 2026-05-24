"""
scubaseason.fun — Dive Site Discovery Blitz
Google Colab script — runs Anthropic OR Gemini (Google AI Studio, free tier)

SETUP (run once):
  1. Add secrets in Colab sidebar (🔑 icon). You only need the one for the
     provider you pick below:
       ANTHROPIC_API_KEY  →  sk-ant-...                  (if PROVIDER="anthropic")
       GOOGLE_API_KEY     →  AIza...                     (if PROVIDER="gemini" — get from https://aistudio.google.com/apikey)
       GITHUB_TOKEN       →  github_pat_...              (needs repo write access)
  2. Run Cell 1 (install), then Cell 2 (config), then Cell 3 (blitz).

COST:
  - anthropic claude-sonnet-4-5  → ~$0.10–0.30 per site
  - gemini-2.5-pro (AI Studio)   → free up to daily quota, then paid
  - gemini-2.5-flash (AI Studio) → free up to a much higher daily quota
"""

# ─── CELL 1: Install dependencies ─────────────────────────────────────────────
# Paste this cell and run it first.

# !pip install anthropic google-genai duckduckgo-search html2text gitpython -q


# ─── CELL 2: Config ───────────────────────────────────────────────────────────
# Fill in once, then run the blitz cell below.

import os
import json
import time
import subprocess
import re
import textwrap
import warnings
from pathlib import Path

# Suppress noisy deprecation warnings from gitpython / jupyter internals
warnings.filterwarnings("ignore", category=DeprecationWarning)
warnings.filterwarnings("ignore", category=RuntimeWarning)

import html2text
import requests
from duckduckgo_search import DDGS

# ── Provider choice ───────────────────────────────────────────────────────────
PROVIDER = "gemini"   # "gemini" (free tier on AI Studio) | "anthropic"

# Model per provider — only the active one is used.
ANTHROPIC_MODEL = "claude-sonnet-4-5"
GEMINI_MODEL    = "gemini-2.5-flash"   # higher free-tier quota than pro; swap to "gemini-2.5-pro" if you have paid quota

GITHUB_REPO   = "bmadninja/scuba"
MAX_SITES     = 500                   # safety cap
DELAY_SECONDS = 30                    # pause between iterations
REPO_DIR      = Path("/content/scuba")

try:
    from google.colab import userdata
    ANTHROPIC_API_KEY = userdata.get("ANTHROPIC_API_KEY") if PROVIDER == "anthropic" else ""
    GOOGLE_API_KEY    = userdata.get("GOOGLE_API_KEY")    if PROVIDER == "gemini"    else ""
    GITHUB_TOKEN      = userdata.get("GITHUB_TOKEN")
except Exception:
    # If running locally or secrets not set, fall back to env vars
    ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY", "")
    GOOGLE_API_KEY    = os.environ.get("GOOGLE_API_KEY", "")
    GITHUB_TOKEN      = os.environ.get("GITHUB_TOKEN", "")

if PROVIDER == "anthropic":
    import anthropic
    anthropic_client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)
    MODEL = ANTHROPIC_MODEL
elif PROVIDER == "gemini":
    from google import genai
    from google.genai import types as genai_types
    gemini_client = genai.Client(api_key=GOOGLE_API_KEY)
    MODEL = GEMINI_MODEL
else:
    raise ValueError(f"Unknown PROVIDER: {PROVIDER}")

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
    """Reset working copy to origin/main. Discards any local edits — safer than
    --autostash because a model that truncated sites.json mid-iteration can't
    leak that corruption into the next iteration."""
    subprocess.run(["git", "fetch", "origin", "--quiet"], cwd=REPO_DIR, capture_output=True)
    subprocess.run(["git", "reset", "--hard", "origin/main", "--quiet"], cwd=REPO_DIR, capture_output=True)


def _sites_count_or_none() -> int | None:
    try:
        return len(json.loads((REPO_DIR / "src/data/sites.json").read_text()))
    except Exception:
        return None


def git_commit_push(site_name: str) -> bool:
    """Stage sites.json, commit, push. Returns True on success."""
    # Safety: never commit a sites.json that shrank
    current = _sites_count_or_none()
    if current is None:
        print(f"  ✗ ABORT COMMIT: sites.json unreadable")
        subprocess.run(["git", "checkout", "HEAD", "--", "src/data/sites.json"],
                       cwd=REPO_DIR, capture_output=True)
        return False
    # Compare against HEAD's sites.json count
    head = subprocess.run(
        ["git", "show", "HEAD:src/data/sites.json"],
        cwd=REPO_DIR, capture_output=True, text=True,
    )
    try:
        head_count = len(json.loads(head.stdout))
    except Exception:
        head_count = current  # if HEAD unreadable, skip the guard
    if current < head_count + 1:
        print(f"  ✗ ABORT COMMIT: sites.json has {current} entries (HEAD: {head_count}) — likely corrupted")
        subprocess.run(["git", "checkout", "HEAD", "--", "src/data/sites.json"],
                       cwd=REPO_DIR, capture_output=True)
        return False

    for attempt in range(3):
        try:
            # Note: do NOT git_pull here — it would hard-reset and wipe the
            # pending append_site change. The blitz loop already pulls before
            # each iteration, so we're up to date with origin/main going in.
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
        "description": "Write content to a file in the local repo. For small files only — do NOT use this to rewrite src/data/sites.json (it is too large). Use append_site instead.",
        "input_schema": {
            "type": "object",
            "properties": {
                "path": {"type": "string", "description": "Relative path from repo root"},
                "content": {"type": "string", "description": "File content"}
            },
            "required": ["path", "content"]
        }
    },
    {
        "name": "append_site",
        "description": "Append ONE new dive-site entry to src/data/sites.json. Pass the site entry as a JSON-encoded STRING in site_json — Python decodes, validates, and atomically appends.",
        "input_schema": {
            "type": "object",
            "properties": {
                "site_json": {"type": "string", "description": "The new site entry as a JSON-encoded string. Must conform to the schema below."}
            },
            "required": ["site_json"]
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
            rel = inputs["path"]
            p = REPO_DIR / rel
            content = inputs["content"]
            # Guard: never let the model shrink sites.json — it should only ever grow
            if rel.endswith("src/data/sites.json"):
                try:
                    new_data = json.loads(content)
                except json.JSONDecodeError as e:
                    return f"REJECTED: invalid JSON for sites.json: {e}"
                if not isinstance(new_data, list):
                    return f"REJECTED: sites.json must be a JSON array, got {type(new_data).__name__}"
                try:
                    old_count = len(json.loads(p.read_text())) if p.exists() else 0
                except Exception:
                    old_count = 0
                if len(new_data) != old_count + 1:
                    return (
                        f"REJECTED: sites.json must grow by exactly 1 entry. "
                        f"Old count: {old_count}, new count: {len(new_data)}. "
                        f"Read the current file with read_file, append your new entry, then write back the full array."
                    )
            p.parent.mkdir(parents=True, exist_ok=True)
            p.write_text(content)
            return f"Written {p}"
        except Exception as e:
            return f"Write error: {e}"
    elif name == "append_site":
        try:
            raw = inputs.get("site_json") or inputs.get("site")
            if isinstance(raw, str):
                try:
                    new_entry = json.loads(raw)
                except json.JSONDecodeError as e:
                    return f"REJECTED: site_json is not valid JSON: {e}"
            else:
                new_entry = raw
            if not isinstance(new_entry, dict):
                return "REJECTED: site_json must decode to a JSON object"
            sites_path = REPO_DIR / "src/data/sites.json"
            try:
                sites = json.loads(sites_path.read_text())
            except Exception as e:
                return f"REJECTED: could not read sites.json: {e}"
            if not isinstance(sites, list):
                return "REJECTED: sites.json is not a JSON array"
            # Required fields check
            required = ["id", "slug", "locationId", "name", "lat", "lng",
                        "description", "depthRange", "skillLevel", "diveTypes",
                        "species", "conditionsByMonth", "bestMonths",
                        "editorialRank", "getThere"]
            missing = [k for k in required if k not in new_entry]
            if missing:
                return f"REJECTED: missing required fields: {missing}"
            if not isinstance(new_entry.get("conditionsByMonth"), list) or len(new_entry["conditionsByMonth"]) != 12:
                return "REJECTED: conditionsByMonth must have exactly 12 entries (months 1-12)"
            # Duplicate check
            new_norm = _norm_name(new_entry.get("name", ""))
            for s in sites:
                if _norm_name(s.get("name", "")) == new_norm:
                    return f"REJECTED: site name {new_entry.get('name')!r} already exists in sites.json"
            sites.append(new_entry)
            sites_path.write_text(json.dumps(sites, indent=2) + "\n")
            return f"OK: appended {new_entry.get('name')!r}. sites.json now has {len(sites)} entries."
        except Exception as e:
            return f"append_site error: {e}"
    return f"Unknown tool: {name}"


# ─── CELL 4: Target picking + discovery prompt ────────────────────────────────

def _norm_name(s: str) -> str:
    """Lowercase + strip non-alphanumerics for fuzzy name matching."""
    return "".join(c.lower() for c in s if c.isalnum())


_session_blacklist: set[str] = set()


def pick_next_target() -> dict | None:
    """Pick the highest-priority entry in coverage-gaps.json that isn't already
    covered in sites.json. Returns None when all gaps are filled."""
    try:
        gaps = json.loads((REPO_DIR / "src/data/coverage-gaps.json").read_text())
    except FileNotFoundError:
        return None
    try:
        sites = json.loads((REPO_DIR / "src/data/sites.json").read_text())
    except FileNotFoundError:
        sites = []
    site_norms = {_norm_name(s.get("name", "")) for s in sites}

    def is_covered(gap: dict) -> bool:
        candidates = [gap.get("name", "")] + list(gap.get("aliases", []) or [])
        for c in candidates:
            cn = _norm_name(c)
            if not cn:
                continue
            for sn in site_norms:
                if cn == sn or (len(cn) >= 5 and (cn in sn or sn in cn)):
                    return True
        return False

    # Sort by priority desc; pick first uncovered and not blacklisted
    sorted_gaps = sorted(gaps, key=lambda g: g.get("priority", 0), reverse=True)
    for g in sorted_gaps:
        if g.get("name") in _session_blacklist:
            continue
        if not is_covered(g):
            return g
    return None


def build_discover_prompt(target: dict) -> str:
    """Build the discovery prompt for a specific pre-picked target site."""
    aliases = ", ".join(target.get("aliases", []) or []) or "(none)"
    location_hint = target.get("ourLocationId") or "(none — you may need to pick or create one)"
    return textwrap.dedent(f"""
    You are autonomously adding ONE specific dive site to scubaseason.fun. The target has been pre-selected for you — DO NOT propose a different site, and DO NOT return EXHAUSTED. We have already verified this site is missing from sites.json.

    ## Your target (mandatory — add this exact site)
    - Name: {target.get("name")}
    - Aliases: {aliases}
    - Country: {target.get("country")}
    - Region: {target.get("region")}
    - Suggested locationId: {location_hint}

    ## Your job
    1. Read `src/data/locations.json` with read_file to find or pick the correct locationId. If no exact match exists, pick the closest geographic location (same country, nearby region) — its id is fine.
    2. Research the target using web_search and web_fetch — find depth, coordinates, species, conditions, AND a great hero image.
    3. Call the `append_site` tool with ONE argument named `site_json` whose value is the new entry serialized as a JSON STRING (use a string literal containing the JSON). DO NOT read or rewrite sites.json — `append_site` handles atomic append for you.
    4. Print exactly: `DONE: {target.get("name")} added successfully`

    You MUST add this site via the append_site tool. The only acceptable outcome is a DONE line after a successful append_site call.""").strip() + "\n\n" + _SCHEMA_AND_RULES

_SCHEMA_AND_RULES = textwrap.dedent("""
## Schema for the `site` object you pass to append_site — match this exactly
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
""").strip()


# ─── CELL 5: Blitz loop ────────────────────────────────────────────────────────

def run_one_discovery_anthropic(prompt: str) -> tuple[str, str]:
    """
    Run one discovery iteration via Anthropic. Returns (status, site_name).
    status: "done" | "exhausted" | "error"
    """
    messages = [{"role": "user", "content": prompt}]

    for turn in range(40):  # max tool-use turns
        response = anthropic_client.messages.create(
            model=MODEL,
            max_tokens=16384,
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


def _gemini_tool_config():
    """Build Gemini Tool list from the shared TOOL_DEFS."""
    return [genai_types.Tool(function_declarations=[
        genai_types.FunctionDeclaration(
            name=t["name"],
            description=t["description"],
            parameters=t["input_schema"],
        ) for t in TOOL_DEFS
    ])]


def run_one_discovery_gemini(prompt: str) -> tuple[str, str]:
    """
    Run one discovery iteration via Gemini (Google AI Studio).
    Returns (status, site_name). status: "done" | "exhausted" | "error"
    """
    contents = [genai_types.Content(
        role="user",
        parts=[genai_types.Part.from_text(text=prompt)],
    )]
    tools = _gemini_tool_config()

    for turn in range(40):
        response = gemini_client.models.generate_content(
            model=MODEL,
            contents=contents,
            config=genai_types.GenerateContentConfig(
                tools=tools,
                max_output_tokens=16384,
            ),
        )

        if not response.candidates:
            return "error", "empty response (no candidates)"
        candidate = response.candidates[0]
        if candidate.content is None or not candidate.content.parts:
            finish = getattr(candidate, "finish_reason", None)
            safety = getattr(candidate, "safety_ratings", None)
            usage = getattr(response, "usage_metadata", None)
            detail = f"finish={finish} safety={safety} usage={usage}"
            return "error", f"no content parts ({detail})"

        contents.append(candidate.content)

        function_calls = []
        for part in candidate.content.parts:
            if getattr(part, "text", None):
                if m := re.search(r"^DONE:\s*(.+)$", part.text, re.MULTILINE):
                    return "done", m.group(1).strip()
            if getattr(part, "function_call", None):
                function_calls.append(part.function_call)

        if not function_calls:
            break

        tool_result_parts = []
        for fc in function_calls:
            args = dict(fc.args) if fc.args else {}
            print(f"  → {fc.name}({json.dumps(args)[:120]})")
            result = run_tool(fc.name, args)
            tool_result_parts.append(genai_types.Part.from_function_response(
                name=fc.name,
                response={"result": result[:8000]},
            ))

        contents.append(genai_types.Content(role="user", parts=tool_result_parts))

    return "error", "no DONE/EXHAUSTED signal emitted"


def run_one_discovery(prompt: str) -> tuple[str, str]:
    if PROVIDER == "anthropic":
        return run_one_discovery_anthropic(prompt)
    return run_one_discovery_gemini(prompt)


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
    fail_streak  = 0  # consecutive failures on the same target
    last_target  = None
    start        = time.time()

    print(f"\n{'='*60}")
    print(f"Blitz started | model={MODEL} | max={max_sites}")
    sites_now = len(json.loads((REPO_DIR / "src/data/sites.json").read_text()))
    print(f"Sites at start: {sites_now}")
    print(f"{'='*60}\n")

    for i in range(1, max_sites + 1):
        git_pull()
        sites_now = len(json.loads((REPO_DIR / "src/data/sites.json").read_text()))

        target = pick_next_target()
        if target is None:
            print(f"── iter {i} | added={added} | total={sites_now} | {time.strftime('%H:%M:%S')} ──")
            print("  → No uncovered targets remain in coverage-gaps.json — stopping.")
            break
        print(f"── iter {i} | added={added} | total={sites_now} | target={target.get('name')!r} (prio={target.get('priority')}) ──")

        prompt = build_discover_prompt(target)
        try:
            status, site = run_one_discovery(prompt)
        except Exception as e:
            msg = str(e)
            is_rate_limit = (
                "429" in msg
                or "RESOURCE_EXHAUSTED" in msg
                or "rate_limit" in msg.lower()
            )
            if is_rate_limit:
                print(f"  Rate limited ({msg[:200]}) — sleeping 60s")
                time.sleep(60)
            else:
                print(f"  API error: {type(e).__name__}: {msg[:400]} — sleeping 30s")
                time.sleep(30)
            continue

        target_name = target.get("name")
        succeeded = False
        if status == "done":
            ok = git_commit_push(site)
            if ok:
                print(f"  ✓ Pushed: {site}")
                added += 1
                succeeded = True
            else:
                print(f"  ✗ Commit failed or rejected: {site}")
        else:
            print(f"  ✗ {status}: {site}")

        if succeeded:
            fail_streak = 0
            last_target = None
        else:
            if target_name == last_target:
                fail_streak += 1
            else:
                fail_streak = 1
                last_target = target_name
            if fail_streak >= 3:
                print(f"  ⚠ Blacklisting {target_name!r} after {fail_streak} consecutive failures — moving on")
                _session_blacklist.add(target_name)
                fail_streak = 0
                last_target = None

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

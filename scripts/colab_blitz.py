"""
scubaseason.fun — Dive Site Discovery Blitz
Google Colab script — runs Gemini through Google AI Studio.

This is the Colab replacement for the local `scripts/blitz-parallel.sh` split.
Open the same Colab notebook in 1-3 browser tabs, choose a different WORKER
preset in each tab, and run the cells. Each tab clones the repo, researches
one uncovered dive site at a time, appends it to src/data/sites.json, commits,
and pushes to main.

SETUP (run once):
  1. In Colab, open the secrets sidebar (key icon) and add:
       GOOGLE_API_KEY or GEMINI_API_KEY → your Google AI Studio key
       GITHUB_TOKEN or GH_TOKEN         → GitHub token with repo write access
  2. Paste this file into a Colab notebook as separate cells at the CELL markers.
  3. Run Cell 1, Cell 2, then all definition cells, then Cell 6.

RUNNING MULTIPLE TABS:
  - Tab 1: WORKER = "indo-pacific"
  - Tab 2: WORKER = "americas-atlantic"
  - Tab 3: WORKER = "indian-med-africa"
  - Start tabs 20-60 seconds apart. The script pulls before every iteration
    and push-retries, so duplicate work is usually skipped safely.

COST:
  - gemini-2.5-flash → cheaper/faster, higher quota; recommended for blitz
  - gemini-2.5-pro   → better reasoning, lower quota/costlier; use sparingly
"""

# ─── CELL 1: Install dependencies ─────────────────────────────────────────────
# Paste this cell and run it first.

# !pip install "google-genai>=1.66,<2.0.0" duckduckgo-search html2text -q


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

# ── Worker choice ─────────────────────────────────────────────────────────────
# Use a different worker in each Colab tab. Use "all" only for a single tab.
WORKER = "indo-pacific"  # "indo-pacific" | "americas-atlantic" | "indian-med-africa" | "all"

WORKER_PRESETS = {
    "indo-pacific": [
        "indonesia", "philippines", "malaysia", "thailand", "vietnam",
        "papua new guinea", "solomon islands", "fiji", "vanuatu",
        "micronesia", "palau", "yap", "chuuk", "pohnpei",
        "french polynesia", "cook islands", "tonga", "samoa",
        "australia", "new zealand", "japan", "south korea", "taiwan",
        "china", "hawaii",
    ],
    "americas-atlantic": [
        "caribbean", "mexico", "cozumel", "socorro", "belize", "honduras",
        "bay islands", "cayman", "costa rica", "cocos", "panama",
        "colombia", "malpelo", "ecuador", "galapagos", "brazil",
        "argentina", "usa", "florida", "california", "canada",
        "iceland", "azores", "canary", "cape verde", "madeira",
        "bermuda", "bahamas",
    ],
    "indian-med-africa": [
        "maldives", "sri lanka", "lakshadweep", "andaman", "india",
        "seychelles", "madagascar", "mauritius", "réunion", "reunion",
        "comoros", "egypt", "red sea", "sudan", "saudi arabia",
        "jordan", "israel", "oman", "yemen", "socotra", "south africa",
        "mozambique", "tanzania", "zanzibar", "pemba", "mafia", "kenya",
        "mediterranean", "malta", "cyprus", "greece", "italy", "spain",
        "france", "croatia", "turkey", "sao tome",
    ],
    "all": [],
}

GEMINI_MODEL  = "gemini-2.5-flash"
GITHUB_REPO   = "bmadninja/scuba"
MAX_SITES     = 500
DELAY_SECONDS = 30
REPO_DIR      = Path("/content/scuba")

try:
    from google.colab import userdata
    GOOGLE_API_KEY = userdata.get("GOOGLE_API_KEY") or userdata.get("GEMINI_API_KEY")
    GITHUB_TOKEN   = userdata.get("GITHUB_TOKEN") or userdata.get("GH_TOKEN")
except Exception:
    # If running locally or secrets not set, fall back to env vars
    GOOGLE_API_KEY = os.environ.get("GOOGLE_API_KEY") or os.environ.get("GEMINI_API_KEY", "")
    GITHUB_TOKEN   = os.environ.get("GITHUB_TOKEN") or os.environ.get("GH_TOKEN", "")

if not GOOGLE_API_KEY:
    raise ValueError("Missing GOOGLE_API_KEY or GEMINI_API_KEY in Colab secrets.")
if not GITHUB_TOKEN:
    raise ValueError("Missing GITHUB_TOKEN or GH_TOKEN in Colab secrets.")
if WORKER not in WORKER_PRESETS:
    raise ValueError(f"Unknown WORKER {WORKER!r}. Use one of: {', '.join(WORKER_PRESETS)}")

from google import genai
from google.genai import types as genai_types

gemini_client = genai.Client(api_key=GOOGLE_API_KEY)
MODEL = GEMINI_MODEL

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


def configure_git_remote():
    """Keep the tokenized remote and commit identity fresh in reused runtimes."""
    token_url = f"https://{GITHUB_TOKEN}@github.com/{GITHUB_REPO}.git"
    subprocess.run(["git", "config", "user.email", "blitz@scubaseason.fun"], cwd=REPO_DIR, check=True)
    subprocess.run(["git", "config", "user.name", "ScubaSeason Blitz"], cwd=REPO_DIR, check=True)
    subprocess.run(["git", "remote", "set-url", "origin", token_url], cwd=REPO_DIR, check=True)


def preflight_github_push():
    """Fail fast before spending Gemini tokens if the GitHub token cannot push."""
    check = subprocess.run(
        ["git", "push", "--dry-run", "origin", "HEAD:main"],
        cwd=REPO_DIR,
        capture_output=True,
        text=True,
    )
    if check.returncode != 0:
        message = (check.stderr or check.stdout or "").strip()
        message = re.sub(r"github_pat_[A-Za-z0-9_]+", "github_pat_***", message)
        raise RuntimeError(
            "GitHub push preflight failed. Fix GITHUB_TOKEN/GH_TOKEN before running the blitz.\n"
            + message
        )
    print("GitHub push preflight passed.")


def _sites_count_or_none() -> int | None:
    try:
        return len(json.loads((REPO_DIR / "src/data/sites.json").read_text()))
    except Exception:
        return None


_DATA_FILES = [
    "src/data/sites.json",
    "src/data/sightings.json",
    "src/data/reef-health.json",
]


def _diff_new_entries(current: list, head: list) -> list:
    head_ids = {s.get("id") for s in head if isinstance(s, dict)}
    return [s for s in current if isinstance(s, dict) and s.get("id") not in head_ids]


def _read_json_safe(path: Path) -> list:
    try:
        v = json.loads(path.read_text())
        return v if isinstance(v, list) else []
    except Exception:
        return []


def _show_head_json(rel: str) -> list:
    p = subprocess.run(["git", "show", f"HEAD:{rel}"], cwd=REPO_DIR, capture_output=True, text=True)
    try:
        v = json.loads(p.stdout)
        return v if isinstance(v, list) else []
    except Exception:
        return []


def git_commit_push(site_name: str) -> bool:
    """Merge the bundle (site + sightings + reef-health) onto latest origin/main."""
    # 1. Snapshot the new entries the model appended in this iteration.
    pending: dict[str, list] = {}
    for rel in _DATA_FILES:
        current = _read_json_safe(REPO_DIR / rel)
        head = _show_head_json(rel)
        pending[rel] = _diff_new_entries(current, head)

    if len(pending["src/data/sites.json"]) != 1:
        print(f"  ✗ ABORT COMMIT: expected exactly 1 new site, found {len(pending['src/data/sites.json'])}")
        for rel in _DATA_FILES:
            subprocess.run(["git", "checkout", "HEAD", "--", rel], cwd=REPO_DIR, capture_output=True)
        return False
    if not pending["src/data/sightings.json"]:
        print(f"  ✗ ABORT COMMIT: site appended without sighting evidence — bundle incomplete")
        for rel in _DATA_FILES:
            subprocess.run(["git", "checkout", "HEAD", "--", rel], cwd=REPO_DIR, capture_output=True)
        return False

    new_site = pending["src/data/sites.json"][0]
    name = new_site.get("name") or site_name
    n_sight = len(pending["src/data/sightings.json"])
    n_rh = len(pending["src/data/reef-health.json"])

    for attempt in range(6):
        try:
            subprocess.run(["git", "fetch", "origin", "main", "--quiet"], cwd=REPO_DIR, check=True)
            # Re-read remote versions of all three files
            remote_state: dict[str, list] = {}
            for rel in _DATA_FILES:
                remote = subprocess.run(
                    ["git", "show", f"origin/main:{rel}"],
                    cwd=REPO_DIR, check=True, capture_output=True, text=True,
                )
                try:
                    arr = json.loads(remote.stdout)
                except Exception:
                    arr = []
                remote_state[rel] = arr if isinstance(arr, list) else []

            # Skip if another tab already pushed this same site id
            if any(s.get("id") == new_site.get("id") for s in remote_state["src/data/sites.json"]):
                print("  → Site already reached origin/main from another tab; skipping local commit.")
                subprocess.run(["git", "reset", "--hard", "origin/main", "--quiet"], cwd=REPO_DIR, capture_output=True)
                return False

            # Merge each pending list onto remote (dedup by id)
            for rel, new_entries in pending.items():
                if not new_entries:
                    continue
                existing_ids = {e.get("id") for e in remote_state[rel] if isinstance(e, dict)}
                for entry in new_entries:
                    if entry.get("id") in existing_ids:
                        continue
                    remote_state[rel].append(entry)

            # Reset to clean origin/main and write merged files
            subprocess.run(["git", "reset", "--hard", "origin/main", "--quiet"], cwd=REPO_DIR, check=True)
            changed_paths = []
            for rel, merged in remote_state.items():
                if pending[rel]:
                    (REPO_DIR / rel).write_text(json.dumps(merged, indent=2) + "\n")
                    changed_paths.append(rel)
            if not changed_paths:
                return False
            subprocess.run(["git", "add", *changed_paths], cwd=REPO_DIR, check=True)
            result = subprocess.run(["git", "diff", "--cached", "--quiet"], cwd=REPO_DIR)
            if result.returncode == 0:
                return False

            extras = []
            if n_sight:
                extras.append(f"{n_sight} sighting{'s' if n_sight != 1 else ''}")
            if n_rh:
                extras.append("reef-health")
            suffix = f" (+ {', '.join(extras)})" if extras else ""
            msg = f"auto: add {name}{suffix}"
            subprocess.run(["git", "commit", "-m", msg], cwd=REPO_DIR, check=True)
            push = subprocess.run(["git", "push", "origin", "HEAD:main"], cwd=REPO_DIR, capture_output=True, text=True)
            if push.returncode == 0:
                return True
            detail = (push.stderr or push.stdout or "").strip().splitlines()
            detail = detail[-1] if detail else "unknown push error"
            print(f"  push retry {attempt + 1}/6: {detail}")
            subprocess.run(["git", "reset", "--hard", "origin/main", "--quiet"], cwd=REPO_DIR, capture_output=True)
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
    },
    {
        "name": "append_sighting",
        "description": "Append ONE sighting-evidence record to src/data/sightings.json. Must be called AFTER append_site (siteId must match the site you just added). Call this 1-3 times to record the headline species at the new site. Pass the record as a JSON-encoded STRING in sighting_json.",
        "input_schema": {
            "type": "object",
            "properties": {
                "sighting_json": {"type": "string", "description": "The new sighting-evidence record as a JSON-encoded string."}
            },
            "required": ["sighting_json"]
        }
    },
    {
        "name": "append_reef_health",
        "description": "Append ONE reef-health record to src/data/reef-health.json. Required when the new site's locationId does NOT already have a reef-health record (Python will tell you which case applies). Skip if already covered. Pass the record as a JSON-encoded STRING in reef_health_json.",
        "input_schema": {
            "type": "object",
            "properties": {
                "reef_health_json": {"type": "string", "description": "The new reef-health record as a JSON-encoded string."}
            },
            "required": ["reef_health_json"]
        }
    }
]


# ── Per-iteration state (reset by blitz loop before each discovery run) ──────
# Tracks what the model has appended this iteration so we can enforce the
# bundled-records contract (1 site + ≥1 sighting + reef-health if needed).
_iteration_state: dict = {
    "site_id": None,        # id of the site just appended via append_site
    "location_id": None,    # locationId of that site
    "sighting_ids": [],     # ids of sightings appended this iteration
    "reef_health_id": None, # id of reef-health appended this iteration (if any)
    "reef_health_needed": False,  # True if locationId has no existing record
}


def _reset_iteration_state():
    _iteration_state.update({
        "site_id": None,
        "location_id": None,
        "sighting_ids": [],
        "reef_health_id": None,
        "reef_health_needed": False,
    })


def _load_valid_ids():
    """Read sources + methodologies once per call. Returns (source_ids, claim_ids)."""
    try:
        sources = json.loads((REPO_DIR / "src/data/sources.json").read_text())
        source_ids = {s.get("id") for s in sources if isinstance(s, dict)}
    except Exception:
        source_ids = set()
    try:
        methods = json.loads((REPO_DIR / "src/data/methodologies.json").read_text())
        claim_ids = {m.get("claimId") for m in methods if isinstance(m, dict)}
    except Exception:
        claim_ids = set()
    return source_ids, claim_ids


def iteration_requirements_met() -> tuple[bool, str]:
    """Check whether the model has fulfilled the bundled-records contract."""
    if not _iteration_state["site_id"]:
        return False, "append_site has not been called yet"
    if not _iteration_state["sighting_ids"]:
        return False, "append_sighting must be called at least once for the new site"
    if _iteration_state["reef_health_needed"] and not _iteration_state["reef_health_id"]:
        return False, (
            f"locationId {_iteration_state['location_id']!r} has no reef-health record yet — "
            "you MUST call append_reef_health before DONE"
        )
    return True, "ok"


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
                if new_entry.get("id") == s.get("id") or new_entry.get("slug") == s.get("slug"):
                    return f"REJECTED: site id/slug {new_entry.get('id')!r} already exists in sites.json"
                if _norm_name(s.get("name", "")) == new_norm:
                    return f"REJECTED: site name {new_entry.get('name')!r} already exists in sites.json"
            try:
                locations = json.loads((REPO_DIR / "src/data/locations.json").read_text())
                location_ids = {l.get("id") for l in locations}
                if new_entry.get("locationId") not in location_ids:
                    return f"REJECTED: locationId {new_entry.get('locationId')!r} does not exist in locations.json"
            except Exception as e:
                return f"REJECTED: could not validate locationId: {e}"
            sites.append(new_entry)
            sites_path.write_text(json.dumps(sites, indent=2) + "\n")
            # Populate iteration state + detect whether reef-health is needed
            _iteration_state["site_id"] = new_entry.get("id")
            _iteration_state["location_id"] = new_entry.get("locationId")
            try:
                rh = json.loads((REPO_DIR / "src/data/reef-health.json").read_text())
                covered_locations = {r.get("locationId") for r in rh if r.get("locationId")}
            except Exception:
                covered_locations = set()
            _iteration_state["reef_health_needed"] = (
                new_entry.get("locationId") not in covered_locations
            )
            rh_msg = (
                f" reef-health REQUIRED for locationId {new_entry.get('locationId')!r}."
                if _iteration_state["reef_health_needed"]
                else f" reef-health already on file for locationId {new_entry.get('locationId')!r} — skip append_reef_health."
            )
            return (
                f"OK: appended {new_entry.get('name')!r}. sites.json now has {len(sites)} entries. "
                f"NEXT: call append_sighting 1-3x for headline species at this site."
                f"{rh_msg}"
            )
        except Exception as e:
            return f"append_site error: {e}"
    elif name == "append_sighting":
        try:
            raw = inputs.get("sighting_json") or inputs.get("sighting")
            if isinstance(raw, str):
                try:
                    rec = json.loads(raw)
                except json.JSONDecodeError as e:
                    return f"REJECTED: sighting_json is not valid JSON: {e}"
            else:
                rec = raw
            if not isinstance(rec, dict):
                return "REJECTED: sighting_json must decode to a JSON object"
            if not _iteration_state["site_id"]:
                return "REJECTED: call append_site first — sighting siteId must match the site you just added."
            required = ["id", "siteId", "speciesCommon", "lastConfirmedAt",
                        "recentRecordCount", "proximityRadiusKm",
                        "seasonalityMonths", "confidence", "sourceIds",
                        "methodologyClaimIds"]
            missing = [k for k in required if k not in rec]
            if missing:
                return f"REJECTED: missing required fields: {missing}"
            if rec.get("siteId") != _iteration_state["site_id"]:
                return (
                    f"REJECTED: sighting siteId {rec.get('siteId')!r} must equal the "
                    f"site you just added ({_iteration_state['site_id']!r})."
                )
            if rec.get("confidence") not in ("high", "medium", "low"):
                return "REJECTED: confidence must be 'high', 'medium', or 'low'"
            if not isinstance(rec.get("seasonalityMonths"), list):
                return "REJECTED: seasonalityMonths must be a list of ints 1-12 (empty list ok)"
            source_ids, claim_ids = _load_valid_ids()
            bad_src = [s for s in rec.get("sourceIds", []) if s not in source_ids]
            if bad_src:
                return f"REJECTED: unknown sourceIds {bad_src}. Valid ids: {sorted(source_ids)}"
            bad_claim = [c for c in rec.get("methodologyClaimIds", []) if c not in claim_ids]
            if bad_claim:
                return f"REJECTED: unknown methodologyClaimIds {bad_claim}. Use 'sighting-occurrence-cluster' for standard GBIF/OBIS-derived sightings."
            sightings_path = REPO_DIR / "src/data/sightings.json"
            sightings = json.loads(sightings_path.read_text())
            if any(s.get("id") == rec.get("id") for s in sightings):
                return f"REJECTED: sighting id {rec.get('id')!r} already exists."
            sightings.append(rec)
            sightings_path.write_text(json.dumps(sightings, indent=2) + "\n")
            _iteration_state["sighting_ids"].append(rec.get("id"))
            return (
                f"OK: appended sighting {rec.get('id')!r}. "
                f"This iteration now has {len(_iteration_state['sighting_ids'])} sighting(s)."
            )
        except Exception as e:
            return f"append_sighting error: {e}"
    elif name == "append_reef_health":
        try:
            raw = inputs.get("reef_health_json") or inputs.get("reef_health")
            if isinstance(raw, str):
                try:
                    rec = json.loads(raw)
                except json.JSONDecodeError as e:
                    return f"REJECTED: reef_health_json is not valid JSON: {e}"
            else:
                rec = raw
            if not isinstance(rec, dict):
                return "REJECTED: reef_health_json must decode to a JSON object"
            if not _iteration_state["site_id"]:
                return "REJECTED: call append_site first."
            if not _iteration_state["reef_health_needed"]:
                return (
                    "REJECTED: locationId already has a reef-health record on file. "
                    "Do NOT call append_reef_health for this iteration."
                )
            required = ["id", "methodologyClaimIds", "lastReviewedAt"]
            missing = [k for k in required if k not in rec]
            if missing:
                return f"REJECTED: missing required fields: {missing}"
            if rec.get("locationId") != _iteration_state["location_id"]:
                return (
                    f"REJECTED: reef-health locationId {rec.get('locationId')!r} must equal "
                    f"{_iteration_state['location_id']!r} (locationId of the site you just added)."
                )
            # Must have at least one of observed / thermalStress so the panel is non-empty
            if not rec.get("observed") and not rec.get("thermalStress"):
                return "REJECTED: provide at least one of 'observed' (in-situ survey) or 'thermalStress' (NOAA CRW)."
            source_ids, claim_ids = _load_valid_ids()
            bad_claim = [c for c in rec.get("methodologyClaimIds", []) if c not in claim_ids]
            if bad_claim:
                return f"REJECTED: unknown methodologyClaimIds {bad_claim}. Use 'reef-health-aims-noaa' for standard reef-health records."
            for section in ("observed", "thermalStress", "projection"):
                sub = rec.get(section)
                if isinstance(sub, dict):
                    bad_src = [s for s in sub.get("sourceIds", []) if s not in source_ids]
                    if bad_src:
                        return f"REJECTED: unknown sourceIds in {section}: {bad_src}. Valid: {sorted(source_ids)}"
            rh_path = REPO_DIR / "src/data/reef-health.json"
            rh = json.loads(rh_path.read_text())
            if any(r.get("id") == rec.get("id") for r in rh):
                return f"REJECTED: reef-health id {rec.get('id')!r} already exists."
            if any(r.get("locationId") == rec.get("locationId") for r in rh):
                return f"REJECTED: locationId {rec.get('locationId')!r} already has a reef-health record."
            rh.append(rec)
            rh_path.write_text(json.dumps(rh, indent=2) + "\n")
            _iteration_state["reef_health_id"] = rec.get("id")
            return f"OK: appended reef-health {rec.get('id')!r} for locationId {rec.get('locationId')!r}."
        except Exception as e:
            return f"append_reef_health error: {e}"
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

    worker_terms = WORKER_PRESETS.get(WORKER, [])

    def in_worker_scope(gap: dict) -> bool:
        if not worker_terms:
            return True
        haystack = " ".join(str(gap.get(k, "")) for k in ["name", "country", "region", "notes"]).lower()
        return any(term.lower() in haystack for term in worker_terms)

    # Sort by priority desc; pick first uncovered and not blacklisted
    sorted_gaps = sorted(gaps, key=lambda g: g.get("priority", 0), reverse=True)
    for g in sorted_gaps:
        if g.get("name") in _session_blacklist:
            continue
        if not in_worker_scope(g):
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
    - Worker/tab: {WORKER}

    ## Your job — bundle of records (site + sightings + reef-health)
    1. Read `src/data/locations.json` with read_file to find or pick the correct locationId. If no exact match exists, pick the closest geographic location (same country, nearby region) — its id is fine.
    2. Research the target using web_search and web_fetch — find depth, coordinates, species, conditions, AND a great hero image. Also research what the SITE IS FAMOUS FOR seeing (1-3 headline species) and (if you'll need it) recent reef condition / NOAA Coral Reef Watch alert for this reef.
    3. Call `append_site` with the site entry.
    4. Call `append_sighting` 1-3 times — one per headline species at this site (the species used to advertise the dive). siteId MUST equal the id of the site you just added.
    5. The `append_site` response will tell you whether the locationId already has a reef-health record. If it does NOT, call `append_reef_health` once for that locationId. If it does, skip this step.
    6. Print exactly: `DONE: {target.get("name")} added successfully`

    DONE will be rejected if any required record (site, ≥1 sighting, reef-health when needed) is missing. The runtime tracks this and will tell you what's still missing — read tool responses carefully.""").strip() + "\n\n" + _SCHEMA_AND_RULES

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

## Schema for `append_sighting` — siteId MUST equal the just-appended site's id
```json
{
  "id": "<siteId>-<species-abbrev>",
  "siteId": "<id of the site you just appended>",
  "speciesCommon": "Reef manta",
  "speciesScientific": "Mobula alfredi",
  "lastConfirmedAt": "2026-04-15",
  "recentRecordCount": 42,
  "proximityRadiusKm": 25,
  "seasonalityMonths": [10,11,12,1,2,3,4],
  "confidence": "high|medium|low",
  "sourceIds": ["gbif", "obis"],
  "methodologyClaimIds": ["sighting-occurrence-cluster"],
  "notes": "Optional"
}
```
- Add 1-3 sightings — only the species the site is actually known for, not every fish on the reef.
- `sourceIds` must be from sources.json (gbif, obis, inaturalist, wildbook, manta-trust, iucn-red-list, reef-life-survey, reef-check, etc).
- `methodologyClaimIds` for standard records: `["sighting-occurrence-cluster"]`.
- `lastConfirmedAt`: ISO date (YYYY-MM-DD) of the most recent confirmed record you can cite. Be honest — set null if no confirmed record on file.
- `recentRecordCount`: confirmed records within the proximity radius in the last 24 months. Estimate from GBIF/OBIS occurrence density; small integers are fine when records are sparse.

## Schema for `append_reef_health` — only when locationId has no record yet
```json
{
  "id": "reef-health-<locationId>-<year>",
  "locationId": "<must equal the locationId of the site you just appended>",
  "observed": {
    "surveyDate": "2024-08-15",
    "surveyMethod": "AIMS LTMP manta-tow + photo-transect | Reef Check protocol survey | Reef Life Survey | AGRRA | NCRMP | GCRMN",
    "coralCoverPercent": 33,
    "bleachedPercent": 12,
    "mortalityPercent": 4,
    "historicalCoralCoverPercent": 28,
    "historicalSurveyDate": "2014-08-01",
    "sourceIds": ["aims-ltmp"],
    "notes": "One-line context about the most recent survey."
  },
  "thermalStress": {
    "asOf": "2026-05-01",
    "alertLevel": "no-stress|watch|warning|alert-1|alert-2",
    "degreeHeatingWeeks": 1.8,
    "sstAnomalyC": 0.6,
    "sourceIds": ["noaa-crw"]
  },
  "divingOutlook": "Plain-English 1-3 sentence diver-facing outlook. What to expect on the reef now. NEVER invent numbers, NEVER project the future.",
  "methodologyClaimIds": ["reef-health-aims-noaa"],
  "lastReviewedAt": "2026-05-24"
}
```
- Required fields: id, locationId, methodologyClaimIds, lastReviewedAt, and at least one of `observed` / `thermalStress`.
- All sourceIds must exist in sources.json. Common ones: aims-ltmp, reef-check, reef-life-survey, gcrmn, agrra, ncrmp, allen-coral-atlas, gbrmpa, icri, noaa-crw.
- Always include `noaa-crw` thermalStress when you can cite a recent alert level; check NOAA Coral Reef Watch for the region.
- Do NOT include `projection` unless you have a peer-reviewed source and methodology to back it.
- Skip this tool entirely if `append_site` told you the locationId already has a record.

## When done
Print exactly: DONE: <site name> added successfully
Only after: append_site (1x), append_sighting (≥1x), append_reef_health (1x if locationId was uncovered).
""").strip()


# ─── CELL 5: Blitz loop ────────────────────────────────────────────────────────

def _gemini_tool_config():
    """Build Gemini Tool list from the shared TOOL_DEFS."""
    return [genai_types.Tool(function_declarations=[
        genai_types.FunctionDeclaration(
            name=t["name"],
            description=t["description"],
            parameters_json_schema=t["input_schema"],
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
        pending_done: str | None = None
        for part in candidate.content.parts:
            if getattr(part, "text", None):
                if m := re.search(r"^DONE:\s*(.+)$", part.text, re.MULTILINE):
                    pending_done = m.group(1).strip()
            if getattr(part, "function_call", None):
                function_calls.append(part.function_call)

        if pending_done is not None:
            ok, reason = iteration_requirements_met()
            if ok:
                return "done", pending_done
            # Inject the reason back so the model fixes it instead of exiting
            print(f"  ↻ DONE rejected: {reason}")
            contents.append(genai_types.Content(
                role="user",
                parts=[genai_types.Part.from_text(text=(
                    f"DONE rejected — {reason}. "
                    "Call the missing tool(s), then re-emit DONE: <site name> added successfully."
                ))],
            ))
            continue

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
    return run_one_discovery_gemini(prompt)


def blitz(max_sites: int = MAX_SITES, delay: int = DELAY_SECONDS):
    # Clone repo if not already present
    if not REPO_DIR.exists():
        token_url = f"https://{GITHUB_TOKEN}@github.com/{GITHUB_REPO}.git"
        print(f"Cloning {GITHUB_REPO}...")
        subprocess.run(["git", "clone", token_url, str(REPO_DIR)], check=True)
    else:
        git_pull()
    configure_git_remote()
    preflight_github_push()

    added        = 0
    fail_streak  = 0  # consecutive failures on the same target
    last_target  = None
    start        = time.time()

    print(f"\n{'='*60}")
    print(f"Blitz started | worker={WORKER} | model={MODEL} | max={max_sites}")
    sites_now = len(json.loads((REPO_DIR / "src/data/sites.json").read_text()))
    print(f"Sites at start: {sites_now}")
    print(f"{'='*60}\n")

    for i in range(1, max_sites + 1):
        git_pull()
        _reset_iteration_state()
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

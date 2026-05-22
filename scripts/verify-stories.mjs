#!/usr/bin/env node
// Story verification harness for scubaSeason.Fun.
// Boots `next dev` on an ephemeral port, hits routes, asserts AC strings,
// and prints a PASS/FAIL summary for each story in STORIES.md.
//
// Usage: node scripts/verify-stories.mjs [--story=B2,B3] [--build]
//   --build   also run `next build` (slower; covers F1)
//   --story   comma-separated story IDs to run (default: all)

import { spawn, spawnSync } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { resolve, join } from "node:path";

const ROOT = resolve(new URL("..", import.meta.url).pathname);
const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, "").split("=");
    return [k, v ?? true];
  }),
);
const ONLY = args.story ? String(args.story).split(",") : null;
let PORT = 4011 + Math.floor(Math.random() * 200);
let BASE = `http://127.0.0.1:${PORT}`;
// eslint-disable-next-line no-unused-vars
let REUSED_SERVER = false;

const results = [];
const record = (id, ac, pass, detail = "") =>
  results.push({ id, ac, pass, detail });

async function fetchText(path) {
  const r = await fetch(BASE + path, { redirect: "follow" });
  return { status: r.status, body: await r.text() };
}

async function probePort(port) {
  try {
    const r = await fetch(`http://127.0.0.1:${port}/`, { signal: AbortSignal.timeout(1500) });
    return r.status < 500;
  } catch {
    return false;
  }
}

async function withDevServer(fn) {
  // Reuse an already-running dev server if available (Next 16 enforces single-instance).
  for (const p of [3000, 3001, 3002]) {
    if (await probePort(p)) {
      PORT = p;
      BASE = `http://127.0.0.1:${p}`;
      REUSED_SERVER = true;
      console.log(`[verify] reusing dev server at ${BASE}`);
      try {
        await fn();
      } finally {
        // do not kill someone else's server
      }
      return;
    }
  }
  const proc = spawn("npx", ["next", "dev", "-p", String(PORT)], {
    cwd: ROOT,
    env: { ...process.env, NODE_ENV: "development" },
    stdio: ["ignore", "pipe", "pipe"],
  });
  let ready = false;
  proc.stdout.on("data", (b) => {
    const s = b.toString();
    if (/Ready|started server|Local:/.test(s)) ready = true;
  });
  proc.stderr.on("data", () => {});
  const deadline = Date.now() + 90_000;
  while (!ready && Date.now() < deadline) {
    await sleep(500);
    try {
      const r = await fetch(BASE + "/");
      if (r.status < 500) {
        ready = true;
        break;
      }
    } catch {}
  }
  if (!ready) {
    proc.kill("SIGTERM");
    throw new Error("dev server did not become ready");
  }
  try {
    await fn();
  } finally {
    proc.kill("SIGTERM");
    await sleep(300);
  }
}

function walk(dir, exts = [".ts", ".tsx", ".js", ".jsx", ".mjs"]) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    if (entry.startsWith(".") || entry === "node_modules") continue;
    const p = join(dir, entry);
    const s = statSync(p);
    if (s.isDirectory()) out.push(...walk(p, exts));
    else if (exts.some((e) => p.endsWith(e))) out.push(p);
  }
  return out;
}

const FLAGSHIP = "raja-ampat-cape-kri";
const SEASONAL = "raja-ampat-blue-magic";

const STORIES = {
  async A1() {
    const r = await fetchText("/");
    record("A1", "200", r.status === 200, `status=${r.status}`);
    record("A1", "brand", /scubaSeason/i.test(r.body));
    const srcFiles = walk(join(ROOT, "src"));
    const conflict = srcFiles.find((p) => {
      const c = readFileSync(p, "utf8");
      return c.includes("<<<<<<<") || c.includes(">>>>>>>");
    });
    record("A1", "no-conflict-markers", !conflict, conflict ? `in ${conflict}` : "");
  },
  async A2() {
    const r = await fetchText("/");
    record("A2", "globe-ref", /globe/i.test(r.body));
    const sites = JSON.parse(readFileSync(join(ROOT, "src/data/sites.json"), "utf8"));
    record("A2", "sites>=100", sites.length >= 100, `count=${sites.length}`);
  },
  async A3() {
    const r = await fetchText("/");
    for (const link of ["/sites", "/about", "/gear"]) {
      record("A3", `link:${link}`, new RegExp(`href="${link}"`).test(r.body));
    }
  },

  async B1() {
    let ok = false;
    for (let i = 0; i < 2 && !ok; i++) {
      const r = await fetchText(`/sites/${FLAGSHIP}`);
      if (r.status === 200) {
        ok = true;
        record("B1", `route:${FLAGSHIP}`, true);
        record("B1", "h1-cape-kri", /<h1[\s\S]*?Cape Kri[\s\S]*?<\/h1>/i.test(r.body));
        return;
      }
      await sleep(1500);
    }
    record("B1", "route", false, "200 not returned");
  },
  async B2() {
    const r = await fetchText(`/sites/${FLAGSHIP}`);
    for (const h of ["Overview", "What you'll see", "Conditions", "Season calendar", "Gear"]) {
      record("B2", `heading:${h}`, r.body.includes(h));
    }
    for (const sub of ["Getting there", "Where to stay", "Who to dive with"]) {
      record("B2", `sub:${sub}`, r.body.includes(sub));
    }
  },
  async B3() {
    const r = await fetchText(`/sites/${FLAGSHIP}`);
    record("B3", "reliability", /year-round|seasonal|rare/i.test(r.body));
    // Peak: months only render for seasonal species — check a site that has them.
    const r2 = await fetchText(`/sites/${SEASONAL}`);
    record("B3", "peak-months", /Peak:/.test(r2.body));
  },
  async B4() {
    const r = await fetchText(`/sites/${FLAGSHIP}`);
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const hits = months.filter((m) => r.body.includes(m)).length;
    record("B4", "12-months", hits >= 12, `hits=${hits}`);
    record("B4", "tempC", /°C/.test(r.body));
    record("B4", "viz-m", /\d+[\s\S]{0,3}m</.test(r.body) || /m<\/td>/.test(r.body));
    record("B4", "current", /mild|moderate|strong/i.test(r.body));
  },
  async B5() {
    const r = await fetchText(`/sites/${FLAGSHIP}`);
    record("B5", "sponsored-rel", /rel="nofollow sponsored noopener"/.test(r.body));
    record("B5", "disclosure", /commission/i.test(r.body));
  },
  async B6() {
    const r = await fetchText(`/sites/${FLAGSHIP}`);
    record("B6", "gear-heading", />Gear<\/h2>/.test(r.body) || /Gear</.test(r.body));
    record("B6", "tier-a-base", /base kit/i.test(r.body));
    record("B6", "tier-b-site", /site-specific/i.test(r.body));
  },
  async B7() {
    const r = await fetchText(`/sites/${FLAGSHIP}`);
    const title = (r.body.match(/<title[^>]*>([^<]+)<\/title>/i) || [])[1] || "";
    record("B7", "title-has-site", /Cape Kri/.test(title), `title=${title}`);
    record("B7", "not-default-title", !/Create Next App/i.test(title));
    record("B7", "og-title", /property="og:title"/.test(r.body));
    record("B7", "json-ld", /application\/ld\+json/.test(r.body));
  },

  async C1() {
    const r = await fetchText("/sites");
    record("C1", "200", r.status === 200);
    const cards = (r.body.match(/href="\/sites\/[a-z0-9-]+"/g) || []).length;
    record("C1", "cards>=3", cards >= 3, `cards=${cards}`);
  },
  async C2() {
    const r = await fetchText("/sites");
    record("C2", "search-input", /type="search"|role="searchbox"/.test(r.body));
  },
  async C3() {
    const r = await fetchText("/sites");
    record("C3", "skill-open-water", /Open Water/.test(r.body));
    record("C3", "skill-advanced", /Advanced/.test(r.body));
    const types = ["pelagics","coral","macro","wrecks","geology","blackwater"];
    const hits = types.filter((t) => new RegExp(t, "i").test(r.body)).length;
    record("C3", "dive-types>=3", hits >= 3, `hits=${hits}`);
  },

  async E1() {
    const r = await fetchText(`/sites/${FLAGSHIP}`);
    if (/rel="nofollow sponsored noopener"/.test(r.body)) {
      record("E1", "has-disclosure", /commission/i.test(r.body));
    } else {
      record("E1", "no-sponsored-yet", true, "no sponsored links — vacuous pass");
    }
  },
  async E2() {
    const r = await fetchText("/about");
    record("E2", "200", r.status === 200);
    record("E2", "policy", /affiliate/i.test(r.body));
  },
  async E4() {
    const r = await fetchText("/gear");
    record("E4", "200", r.status === 200);
    const cards = (r.body.match(/data-gear-id|class="[^"]*gear-card|<article/gi) || []).length;
    record(
      "E4",
      "gear>=5",
      cards >= 5 || (r.body.match(/\$\d/g) || []).length >= 5,
      `cards=${cards}`,
    );
  },

  async F3a() {
    const r = await fetchText("/sitemap.xml");
    record("F3", "sitemap-200", r.status === 200);
    record("F3", "urlset", /<urlset/.test(r.body));
    const r2 = await fetchText("/robots.txt");
    record("F3", "robots-200", r2.status === 200);
  },
};

const OFFLINE = {
  D1() {
    const lp = join(ROOT, "src/data/locations.json");
    const sp = join(ROOT, "src/data/sites.json");
    record("D1", "locations.json", existsSync(lp));
    record("D1", "sites.json", existsSync(sp));
    if (existsSync(lp)) {
      const locs = JSON.parse(readFileSync(lp, "utf8"));
      record("D1", "locations-nonempty", Array.isArray(locs) && locs.length > 0);
    }
    if (existsSync(sp)) {
      const sites = JSON.parse(readFileSync(sp, "utf8"));
      const required = [
        "id","slug","locationId","name","lat","lng","depthRange",
        "skillLevel","diveTypes","species","conditionsByMonth","bestMonths",
      ];
      const missing = sites[0] ? required.filter((k) => !(k in sites[0])) : required;
      record("D1", "schema", missing.length === 0, `missing=${missing.join(",")}`);
    }
  },
  D2() {
    const sp = join(ROOT, "src/data/sites.json");
    if (!existsSync(sp)) return record("D2", "top10", false, "no sites.json");
    const sites = JSON.parse(readFileSync(sp, "utf8"));
    const top = ["maldives","raja-ampat","komodo","galapagos","cocos","socorro","palau","red-sea","sipadan","tubbataha"];
    const hit = top.filter((d) =>
      sites.some((s) => (s.locationId || "").toLowerCase().includes(d)),
    ).length;
    record("D2", "top10>=5", hit >= 5, `hit=${hit}`);
  },
  E3() {
    const grep = spawnSync("grep", [
      "-r","-l",
      "gear_click\\|lodging_click\\|operator_click\\|flight_click",
      join(ROOT, "src"),
    ]);
    record("E3", "tracking-event", grep.status === 0);
  },
  F2() {
    const r = spawnSync("npm", ["run", "lint"], { cwd: ROOT });
    record("F2", "exit0", r.status === 0, `code=${r.status}`);
  },
  F1() {
    if (!args.build) return;
    const r = spawnSync("npm", ["run", "build"], { cwd: ROOT, stdio: "pipe" });
    const out = (r.stdout?.toString() || "") + (r.stderr?.toString() || "");
    record("F1", "exit0", r.status === 0, `code=${r.status}`);
    record("F1", "no-ts-error", !/Type error/i.test(out));
  },
};

const want = (id) => !ONLY || ONLY.includes(id);

(async () => {
  for (const id of Object.keys(OFFLINE)) {
    if (!want(id)) continue;
    try {
      OFFLINE[id]();
    } catch (e) {
      record(id, "threw", false, String(e?.message || e));
    }
  }
  const serverIds = Object.keys(STORIES);
  if (serverIds.some((id) => want(id))) {
    try {
      await withDevServer(async () => {
        for (const id of serverIds) {
          if (!want(id)) continue;
          try {
            await STORIES[id]();
          } catch (e) {
            record(id, "threw", false, String(e?.message || e));
          }
        }
      });
    } catch (e) {
      record("DEV", "server-up", false, String(e?.message || e));
    }
  }
  // group + print
  const byId = {};
  for (const r of results) (byId[r.id] ||= []).push(r);
  const ids = Object.keys(byId).sort();
  let pass = 0;
  const failing = [];
  for (const id of ids) {
    const acs = byId[id];
    const ok = acs.every((a) => a.pass);
    if (ok) pass++;
    else failing.push(id);
    console.log(`\n[${ok ? "PASS" : "FAIL"}] ${id}`);
    for (const a of acs) {
      console.log(`   ${a.pass ? "✓" : "✗"} ${a.ac}${a.detail ? " — " + a.detail : ""}`);
    }
  }
  console.log(`\nSummary: ${pass} passing, ${failing.length} failing.`);
  if (failing.length) console.log(`Next to fix: ${failing[0]}`);
  process.exit(failing.length ? 1 : 0);
})();

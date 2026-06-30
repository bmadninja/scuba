"use client";

import { useState, useRef, useCallback, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import sitesRaw from "@/data/sites.json";
import exifr from "exifr";

// ─── Types ────────────────────────────────────────────────────────────────────

type Mode = "sighting" | "survey";
type Category = "fish" | "shark" | "turtle" | "invert" | "other";
type BleachingScore = "healthy" | "pale" | "bleached" | "dead";
type WizardStep = 1 | 2 | 3;
type RoutingCategory = "seahorse" | "whale_dolphin" | "whale_shark" | "coral";
type SurveyStep = 1 | 2 | 3 | 4;

type CoralWatchEntry = {
  growthForm: string;
  lightestShade: number;
  darkestShade: number;
};

type ReefSurveyData = {
  site: SiteOption | null;
  date: string;
  depthM: string;
  transectLengthM: string;
  numQuadrats: string;
  quadratSizeM2: string;
  pointsPerQuadrat: string;
  reefSlope: string;
  observerEmail: string;
  notes: string;
  coralEntries: CoralWatchEntry[];
};

type SurveySubmitResponse = {
  success?: boolean;
  queued?: boolean;
  message?: string;
  error?: string;
};

type SiteOption = {
  id: string;
  slug: string;
  name: string;
  lat: number;
  lng: number;
  locationId?: string;
};

type TaxonSuggestion = {
  taxonId: number;
  scientificName: string;
  commonName: string | null;
  isSeahorse: boolean;
};

type SpeciesChip = {
  taxonId?: number;
  displayName: string;
  isSeahorse: boolean;
  isFreeText: boolean;
};

type FormData = {
  site: SiteOption | null;
  photos: File[];
  date: string;
  category: Category | null;
  species: SpeciesChip[];
  depthM: string;
  tempC: string;
  bleachingScore: BleachingScore | null;
  notes: string;
  routingCategory: RoutingCategory | null;
  speciesHint: string | null;
};

type SubmitResponse = {
  success?: boolean;
  ok?: boolean;
  observationUrl?: string;
  observationId?: number;
  platforms?: string[];
  submittedTo?: string[];
  queued?: boolean;
  message?: string;
  error?: string;
};

// ─── Site list ────────────────────────────────────────────────────────────────

const ALL_SITES: SiteOption[] = (sitesRaw as Array<{
  id: string;
  slug?: string;
  name: string;
  lat: number;
  lng: number;
  locationId?: string;
}>).map((s) => ({
  id: s.id,
  slug: s.slug ?? s.id,
  name: s.name,
  lat: s.lat,
  lng: s.lng,
  locationId: s.locationId,
}));

// Simple substring search — no fuse.js in package.json
function searchSites(query: string): SiteOption[] {
  if (query.length < 2) return [];
  const q = query.toLowerCase();
  return ALL_SITES.filter(
    (s) =>
      s.name.toLowerCase().includes(q) ||
      (s.locationId ?? "").toLowerCase().includes(q)
  ).slice(0, 8);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const RAW_EXTS = new Set(["arw", "cr2", "nef", "dng", "rw2", "orf"]);
const HEIC_EXTS = new Set(["heic", "heif"]);
const MAX_PHOTOS = 10;
const MAX_BYTES = 20 * 1024 * 1024;

async function readExifDate(file: File): Promise<string | null> {
  try {
    const tags = await exifr.parse(file, { pick: ["DateTimeOriginal", "DateTime"] });
    if (!tags) return null;
    const raw: Date | string | undefined = tags.DateTimeOriginal ?? tags.DateTime;
    if (!raw) return null;
    const d = raw instanceof Date ? raw : new Date(raw);
    if (isNaN(d.getTime())) return null;
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  } catch {
    return null;
  }
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function nearestSiteWithinKm(lat: number, lng: number, radiusKm: number): SiteOption | null {
  let best: SiteOption | null = null;
  let bestDist = Infinity;
  for (const site of ALL_SITES) {
    const d = haversineKm(lat, lng, site.lat, site.lng);
    if (d < bestDist && d <= radiusKm) {
      bestDist = d;
      best = site;
    }
  }
  return best;
}

// ─── Step indicator ──────────────────────────────────────────────────────────

const STEP_LABELS = ["Dive site", "Your sighting"];

function StepIndicator({ currentStep }: { currentStep: WizardStep }) {
  return (
    <div className="mb-8">
      <div className="flex items-center">
        {STEP_LABELS.map((label, i) => {
          const stepNum = i + 1;
          const completed = currentStep > stepNum;
          const active = currentStep === stepNum;
          return (
            <div key={label} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-mono transition-colors"
                  style={{
                    background: completed
                      ? "var(--color-ink)"
                      : active
                      ? "var(--color-brand-yellow)"
                      : "var(--color-paper)",
                    color: completed
                      ? "var(--color-paper)"
                      : active
                      ? "var(--color-ink)"
                      : "var(--color-ink-2)",
                    border: completed || active ? "none" : "1px solid var(--color-hairline)",
                    minWidth: 28,
                    minHeight: 28,
                  }}
                >
                  {completed ? "✓" : stepNum}
                </div>
                <span
                  className="mt-1 text-center"
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 11,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    color: "var(--color-ink-2)",
                    whiteSpace: "nowrap",
                  }}
                >
                  {label}
                </span>
              </div>
              {i < STEP_LABELS.length - 1 && (
                <div
                  className="flex-1 mx-2 transition-colors"
                  style={{
                    height: 1,
                    background: completed ? "var(--color-ink)" : "var(--color-hairline)",
                    marginBottom: 18, // align with circle centers
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Photo thumbnail ──────────────────────────────────────────────────────────

function PhotoThumb({ file, onRemove }: { file: File; onRemove: () => void }) {
  const [url, setUrl] = useState<string | null>(null);
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  const isHeic = HEIC_EXTS.has(ext);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (isHeic) return;
    const u = URL.createObjectURL(file);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [file, isHeic]);
  /* eslint-enable react-hooks/set-state-in-effect */

  return (
    <div className="relative">
      {isHeic ? (
        <div
          className="w-20 h-20 rounded flex items-center justify-center text-center p-1"
          style={{
            background: "var(--color-hairline)",
            fontSize: 10,
            color: "var(--color-ink-2)",
            fontFamily: "var(--font-mono)",
            wordBreak: "break-all",
          }}
        >
          {file.name}
        </div>
      ) : url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt=""
          className="w-20 h-20 object-cover rounded"
        />
      ) : null}
      <button
        type="button"
        aria-label="Remove photo"
        onClick={onRemove}
        className="absolute top-0.5 right-0.5 rounded-full flex items-center justify-center"
        style={{
          width: 20,
          height: 20,
          minWidth: 20,
          minHeight: 20,
          background: "rgba(14,28,40,0.8)",
          border: "none",
          color: "var(--color-paper)",
          fontSize: 12,
          cursor: "pointer",
          lineHeight: 1,
        }}
      >
        ×
      </button>
    </div>
  );
}

// ─── Ghost button ─────────────────────────────────────────────────────────────

function GhostBtn({
  onClick,
  children,
  disabled,
}: {
  onClick: () => void;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="rounded-sm px-5 py-3 font-sans text-sm transition-colors"
      style={{
        background: "none",
        border: "1px solid var(--color-hairline)",
        color: "var(--color-ink)",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        minHeight: 44,
      }}
    >
      {children}
    </button>
  );
}

// ─── Primary button ───────────────────────────────────────────────────────────

function PrimaryBtn({
  onClick,
  children,
  disabled,
  loading,
}: {
  onClick?: () => void;
  children: React.ReactNode;
  disabled?: boolean;
  loading?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className="rounded-sm px-5 py-3 font-sans text-sm font-medium transition-opacity"
      style={{
        background: disabled || loading ? "var(--color-hairline)" : "var(--color-brand-yellow)",
        color: disabled || loading ? "var(--color-ink-2)" : "var(--color-ink)",
        border: "none",
        cursor: disabled || loading ? "not-allowed" : "pointer",
        minHeight: 44,
      }}
    >
      {loading ? "Submitting..." : children}
    </button>
  );
}

// ─── Step 1: Site search ──────────────────────────────────────────────────────

function Step1SiteSearch({
  formData,
  onSelectSite,
  onSkip,
  onNext,
}: {
  formData: FormData;
  onSelectSite: (site: SiteOption | null) => void;
  onSkip: () => void;
  onNext: () => void;
}) {
  const [query, setQuery] = useState(formData.site?.name ?? "");
  const [results, setResults] = useState<SiteOption[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (query.length >= 2) {
      const r = searchSites(query);
      setResults(r);
      setDropdownOpen(r.length > 0);
    } else {
      setResults([]);
      setDropdownOpen(false);
    }
  }, [query]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const handleSelect = (site: SiteOption) => {
    setQuery(site.name);
    onSelectSite(site);
    setDropdownOpen(false);
    setTimeout(() => onNext(), 300);
  };

  const tooFewResults = query.length >= 2 && results.length < 2;

  return (
    <div>
      <h2
        className="mb-2"
        style={{
          fontFamily: "var(--font-serif)",
          fontWeight: 300,
          fontStyle: "italic",
          fontSize: "1.75rem",
          color: "var(--color-ink)",
        }}
        tabIndex={-1}
        id="step-heading"
      >
        Where did you dive?
      </h2>
      <p className="mb-6 text-sm" style={{ color: "var(--color-ink-2)" }}>
        Search for the dive site to attach your sighting.
      </p>

      <div className="relative mb-4">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            onSelectSite(null);
          }}
          onFocus={() => {
            if (results.length > 0) setDropdownOpen(true);
          }}
          placeholder="Where did you dive?"
          className="w-full rounded-sm px-4 py-3 font-sans"
          style={{
            border: "1px solid var(--color-hairline)",
            outline: "none",
            fontSize: "1rem",
            color: "var(--color-ink)",
            background: "var(--color-paper)",
          }}
          onFocusCapture={() => setDropdownOpen(results.length > 0)}
        />
        {dropdownOpen && results.length > 0 && (
          <ul
            className="absolute left-0 right-0 z-50 bg-white rounded-sm shadow-sm"
            style={{
              top: "100%",
              border: "1px solid var(--color-hairline)",
              listStyle: "none",
              margin: 0,
              padding: 0,
            }}
          >
            {results.map((site) => (
              <li key={site.id}>
                <button
                  type="button"
                  onMouseDown={() => handleSelect(site)}
                  className="w-full text-left px-4 py-3 font-sans text-sm"
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "var(--color-ink)",
                    borderBottom: "1px solid var(--color-hairline)",
                    minHeight: 44,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                  }}
                >
                  <span className="font-medium">{site.name}</span>
                  {site.locationId && (
                    <span
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: 11,
                        color: "var(--color-ink-2)",
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                      }}
                    >
                      {site.locationId.replace(/-/g, " ")}
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {formData.site && (
        <p
          className="mb-4 text-sm"
          style={{ color: "var(--color-improving)", fontFamily: "var(--font-mono)", fontSize: 12 }}
        >
          Site selected: {formData.site.name}
        </p>
      )}

      {(tooFewResults || (query.length >= 2 && results.length === 0)) && (
        <button
          type="button"
          onClick={() => {
            onSelectSite(null);
            onSkip();
          }}
          className="text-sm underline mb-4 block"
          style={{ color: "var(--color-ocean)", background: "none", border: "none", cursor: "pointer", padding: 0 }}
        >
          Site not listed — continue anyway
        </button>
      )}

      <div className="flex gap-3 flex-wrap mt-6">
        <PrimaryBtn onClick={onNext} disabled={false}>
          Continue
        </PrimaryBtn>
      </div>
    </div>
  );
}

// ─── Step 2: Photos + category + species ─────────────────────────────────────

function Step2Sighting({
  formData,
  setFormData,
  onBack,
  onGoBackToSiteSearch,
  onSuccess,
}: {
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  onBack: () => void;
  onGoBackToSiteSearch: () => void;
  onSuccess: (res: SubmitResponse) => void;
}) {
  const [dragging, setDragging] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [gpsDetectedSite, setGpsDetectedSite] = useState<SiteOption | null>(null);
  const [gpsBannerDismissed, setGpsBannerDismissed] = useState(false);
  const [speciesQuery, setSpeciesQuery] = useState("");
  const [taxonSuggestions, setTaxonSuggestions] = useState<TaxonSuggestion[]>([]);
  const [speciesDropdownOpen, setSpeciesDropdownOpen] = useState(false);
  const [speciesError, setSpeciesError] = useState<string | null>(null);
  const [charCount, setCharCount] = useState(formData.notes.length);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const addFiles = useCallback(
    async (files: FileList | null) => {
      if (!files) return;
      setPhotoError(null);
      const incoming = Array.from(files);

      for (const f of incoming) {
        const ext = f.name.split(".").pop()?.toLowerCase() ?? "";
        if (RAW_EXTS.has(ext)) {
          setPhotoError("Please export as JPEG before uploading.");
          return;
        }
        if (f.size > MAX_BYTES) {
          setPhotoError("This photo is too large. Please resize to under 20 MB.");
          return;
        }
      }

      setFormData((prev) => {
        const remaining = MAX_PHOTOS - prev.photos.length;
        if (remaining <= 0) {
          setPhotoError("Maximum 10 photos per sighting.");
          return prev;
        }
        const toAdd = incoming.slice(0, remaining);
        if (incoming.length > remaining) {
          setPhotoError("Maximum 10 photos per sighting.");
        }
        return { ...prev, photos: [...prev.photos, ...toAdd] };
      });

      if (incoming.length > 0) {
        // Both EXIF reads fire in background — thumbnails already shown above
        const firstFile = incoming[0];
        (async () => {
          try {
            const tags = await exifr.parse(firstFile, { pick: ["DateTimeOriginal", "DateTime", "latitude", "longitude"] });
            if (tags) {
              if (!formData.date) {
                const raw: Date | string | undefined = tags.DateTimeOriginal ?? tags.DateTime;
                if (raw) {
                  const d = raw instanceof Date ? raw : new Date(raw);
                  if (!isNaN(d.getTime())) {
                    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
                    setFormData((prev) => ({ ...prev, date: iso }));
                  }
                }
              }
              if (typeof tags.latitude === "number" && typeof tags.longitude === "number") {
                const site = nearestSiteWithinKm(tags.latitude, tags.longitude, 50);
                if (site) {
                  setGpsDetectedSite(site);
                  setGpsBannerDismissed(false);
                  setFormData((prev) => ({ ...prev, site }));
                }
              }
            }
          } catch { /* ignore */ }
        })();
      }
    },
    [formData.date, setFormData]
  );

  const removePhoto = (i: number) => {
    setFormData((prev) => ({
      ...prev,
      photos: prev.photos.filter((_, idx) => idx !== i),
    }));
    setPhotoError(null);
  };

  const fetchTaxa = useCallback((q: string) => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    if (q.length < 2) { setTaxonSuggestions([]); setSpeciesDropdownOpen(false); return; }
    searchTimerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/taxa/search?q=${encodeURIComponent(q)}`);
        const data = (await res.json()) as { taxa: TaxonSuggestion[] };
        setTaxonSuggestions(data.taxa ?? []);
        setSpeciesDropdownOpen((data.taxa ?? []).length > 0);
      } catch { setTaxonSuggestions([]); }
    }, 320);
  }, []);

  const handleSpeciesInput = (v: string) => {
    setSpeciesQuery(v);
    fetchTaxa(v);
  };

  const addChip = (chip: SpeciesChip) => {
    if (formData.species.length >= 8) {
      setSpeciesError("Maximum 8 species per sighting.");
      return;
    }
    setSpeciesError(null);
    setFormData((prev) => ({ ...prev, species: [...prev.species, chip] }));
    setSpeciesQuery("");
    setTaxonSuggestions([]);
    setSpeciesDropdownOpen(false);
  };

  const selectTaxon = (t: TaxonSuggestion) => {
    addChip({
      taxonId: t.taxonId,
      displayName: t.commonName ? `${t.commonName} (${t.scientificName})` : t.scientificName,
      isSeahorse: t.isSeahorse,
      isFreeText: false,
    });
  };

  const commitFreeTextChip = () => {
    const q = speciesQuery.trim();
    if (!q) { setSpeciesDropdownOpen(false); return; }
    addChip({ displayName: q, isSeahorse: false, isFreeText: true });
  };

  const removeChip = (i: number) => {
    setFormData((prev) => ({
      ...prev,
      species: prev.species.filter((_, idx) => idx !== i),
    }));
    setSpeciesError(null);
  };

  const setCategory = (c: Category) => {
    setFormData((prev) => ({
      ...prev,
      category: c,
      routingCategory: null,
      bleachingScore: null,
      speciesHint: null,
    }));
  };

  const setSubOption = (routing: RoutingCategory | null, hint: string | null) => {
    setFormData((prev) => ({
      ...prev,
      routingCategory: routing,
      speciesHint: hint,
      bleachingScore: routing === "coral" ? prev.bleachingScore : null,
    }));
  };

  const CAT_OPTIONS: { value: Category; label: string; description: string }[] = [
    { value: "fish",   label: "Fish",                description: "Reef fish, pelagic fish, anything finned." },
    { value: "shark",  label: "Sharks & rays",       description: "All sharks, rays, skates, and related species." },
    { value: "turtle", label: "Turtles",             description: "Sea turtles of any species." },
    { value: "invert", label: "Invertebrates",       description: "Corals, nudibranchs, octopus, crab, urchins — anything without a backbone." },
    { value: "other",  label: "Other / I'm not sure", description: "Marine mammals, sea snakes, anything that does not fit above." },
  ];

  type SubOption = { label: string; routing?: RoutingCategory; hint?: string };
  const CAT_SUB_OPTIONS: Partial<Record<Category, SubOption[]>> = {
    shark: [
      { label: "Whale shark",   routing: "whale_shark" },
      { label: "Hammerhead",    hint: "hammerhead" },
      { label: "Manta ray",     hint: "manta_ray" },
      { label: "Nurse shark",   hint: "nurse_shark" },
      { label: "Reef shark",    hint: "reef_shark" },
      { label: "Stingray",      hint: "stingray" },
    ],
    invert: [
      { label: "Coral",        routing: "coral" },
      { label: "Seahorse",     routing: "seahorse" },
      { label: "Octopus / cuttlefish", hint: "octopus_cuttlefish" },
      { label: "Nudibranch",   hint: "nudibranch" },
    ],
    other: [
      { label: "Whale or dolphin", routing: "whale_dolphin" },
      { label: "Dugong",           hint: "dugong" },
      { label: "Sea snake",        hint: "sea_snake" },
    ],
  };

  const BLEACH_OPTIONS: { value: BleachingScore; label: string }[] = [
    { value: "healthy", label: "Healthy" },
    { value: "pale", label: "Pale" },
    { value: "bleached", label: "Bleached" },
    { value: "dead", label: "Dead" },
  ];

  const handleSubmit = async () => {
    if (formData.photos.length === 0) {
      setPhotoError("Please add at least 1 photo.");
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    try {
      const fd = new FormData();
      if (formData.site) {
        fd.append("siteId", formData.site.id);
        fd.append("siteName", formData.site.name);
        fd.append("siteLat", String(formData.site.lat));
        fd.append("siteLng", String(formData.site.lng));
      } else {
        fd.append("siteId", "unknown");
        fd.append("siteName", "Not specified");
        fd.append("siteLat", "0");
        fd.append("siteLng", "0");
      }
      const inatCategory = (formData.category === "fish" || formData.category === "shark") ? "fish" : "other";
      fd.append("category", inatCategory);
      fd.append("observedOn", formData.date);
      fd.append("isSeahorse", String(formData.routingCategory === "seahorse"));
      fd.append("routingCategory", formData.routingCategory ?? "");
      fd.append("needsReview", "false");
      if (formData.depthM) fd.append("depthM", formData.depthM);
      if (formData.tempC) fd.append("tempC", formData.tempC);
      if (formData.bleachingScore) fd.append("bleachingScore", formData.bleachingScore);
      if (formData.speciesHint) fd.append("speciesHint", formData.speciesHint);
      const CAT_LABELS: Record<Category, string> = { fish: "Fish", shark: "Sharks & rays", turtle: "Turtle", invert: "Invertebrate", other: "Other" };
      const subLabel = formData.speciesHint ?? (formData.routingCategory === "whale_shark" ? "Whale shark" : formData.routingCategory === "seahorse" ? "Seahorse" : formData.routingCategory === "whale_dolphin" ? "Whale or dolphin" : formData.routingCategory === "coral" ? "Coral" : null);
      const speciesDisplay = subLabel ?? (formData.category ? CAT_LABELS[formData.category] : "Unknown");
      fd.append("speciesDisplay", speciesDisplay);
      for (const p of formData.photos) fd.append("photos", p);
      const res = await fetch("/api/submit-sighting", { method: "POST", body: fd });
      const data = (await res.json()) as SubmitResponse;
      if (!res.ok) setErrorMsg(data.error ?? data.message ?? "Submission failed. Please try again.");
      else onSuccess(data);
    } catch {
      setErrorMsg("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2
        className="mb-2"
        style={{
          fontFamily: "var(--font-serif)",
          fontWeight: 300,
          fontStyle: "italic",
          fontSize: "1.75rem",
          color: "var(--color-ink)",
        }}
        tabIndex={-1}
        id="step-heading"
      >
        Your sighting
      </h2>

      {/* Photo upload */}
      <section className="mb-6">
        <p
          className="mb-3 text-sm"
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            color: "var(--color-ink-2)",
          }}
        >
          Photos (required, up to 10)
        </p>

        <div
          role="button"
          tabIndex={0}
          aria-label="Upload photos — drag and drop or click to select"
          onClick={() => fileInputRef.current?.click()}
          onKeyDown={(e) => e.key === "Enter" && fileInputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files); }}
          className="rounded-sm text-center cursor-pointer transition-colors mb-3"
          style={{
            border: `2px dashed ${dragging ? "var(--color-ink)" : "var(--color-hairline)"}`,
            background: dragging ? "rgba(14,28,40,0.03)" : "transparent",
            padding: "2rem 1rem",
          }}
        >
          <p className="text-sm mb-1" style={{ color: "var(--color-ink-2)" }}>
            Drag photos here, or
          </p>
          <span
            className="text-sm font-medium"
            style={{ color: "var(--color-ocean)", textDecoration: "underline" }}
          >
            choose files
          </span>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--color-ink-2)", marginTop: 8 }}>
            JPEG / PNG / WebP / HEIC — max 20 MB each
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".jpg,.jpeg,.png,.webp,.heic,.heif"
            multiple
            style={{ display: "none" }}
            onChange={(e) => addFiles(e.target.files)}
          />
        </div>

        {formData.photos.length > 0 && (
          <div className="grid gap-2 mb-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(80px, 1fr))" }}>
            {formData.photos.map((f, i) => (
              <PhotoThumb key={`${f.name}-${i}`} file={f} onRemove={() => removePhoto(i)} />
            ))}
          </div>
        )}

        {gpsDetectedSite && !gpsBannerDismissed && (
          <div
            className="flex items-center justify-between rounded-sm px-3 py-2 mb-3 text-sm"
            style={{
              background: "rgba(0,120,180,0.07)",
              border: "1px solid var(--color-ocean)",
              color: "var(--color-ink)",
            }}
          >
            <span>
              We detected{" "}
              <span style={{ fontWeight: 600 }}>{gpsDetectedSite.name}</span>{" "}
              from your photo.{" "}
              <button
                type="button"
                onClick={() => {
                  setGpsBannerDismissed(true);
                  setGpsDetectedSite(null);
                  setFormData((prev) => ({ ...prev, site: null }));
                  onGoBackToSiteSearch();
                }}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--color-ocean)",
                  padding: 0,
                  textDecoration: "underline",
                  fontSize: "inherit",
                }}
              >
                Change
              </button>
            </span>
            <button
              type="button"
              aria-label="Dismiss"
              onClick={() => setGpsBannerDismissed(true)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--color-ink-2)",
                fontSize: 16,
                lineHeight: 1,
                padding: "0 0 0 8px",
              }}
            >
              ×
            </button>
          </div>
        )}

        {photoError && (
          <p className="text-sm mt-1" style={{ color: "var(--color-declining)" }}>{photoError}</p>
        )}
      </section>

      {/* Category */}
      <section className="mb-6">
        <p
          className="mb-3 text-sm"
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            color: "var(--color-ink-2)",
          }}
        >
          What did you photograph?
        </p>
        <div className="flex flex-col gap-2">
          {CAT_OPTIONS.map((opt) => {
            const isSelected = formData.category === opt.value;
            return (
              <div key={opt.value}>
                <button
                  type="button"
                  onClick={() => setCategory(opt.value)}
                  className="w-full rounded-sm px-4 text-left font-sans text-sm transition-colors"
                  style={{
                    minHeight: 60,
                    border: isSelected ? "2px solid var(--color-brand-yellow)" : "1px solid var(--color-hairline)",
                    background: isSelected ? "rgba(246,199,0,0.05)" : "var(--color-paper)",
                    color: "var(--color-ink)",
                    cursor: "pointer",
                    borderRadius: isSelected ? "2px 2px 0 0" : undefined,
                  }}
                >
                  <span style={{ fontWeight: 600 }}>{opt.label}</span>
                  <span className="block mt-0.5" style={{ color: "var(--color-ink-2)", fontSize: 12, fontWeight: 400 }}>{opt.description}</span>
                </button>

                {/* Sub-options expand inline under the selected card */}
                {isSelected && CAT_SUB_OPTIONS[opt.value] && (
                  <div className="px-4 pt-3 pb-3" style={{ border: "2px solid var(--color-brand-yellow)", borderTop: "none", background: "rgba(246,199,0,0.03)", borderRadius: "0 0 2px 2px" }}>
                    <div className="flex flex-wrap gap-2">
                      {CAT_SUB_OPTIONS[opt.value]!.map((sub) => {
                        const isSubSelected = sub.routing ? formData.routingCategory === sub.routing : formData.speciesHint === sub.hint;
                        return (
                          <button
                            key={sub.label}
                            type="button"
                            onClick={() => {
                              if (isSubSelected) { setSubOption(null, null); }
                              else { setSubOption(sub.routing ?? null, sub.hint ?? null); }
                            }}
                            className="rounded-sm px-4 py-2 font-sans text-sm transition-colors"
                            style={{ minHeight: 40, border: isSubSelected ? "2px solid var(--color-brand-yellow)" : "1px solid var(--color-hairline)", background: isSubSelected ? "rgba(246,199,0,0.1)" : "var(--color-paper)", color: "var(--color-ink)", cursor: "pointer", fontWeight: isSubSelected ? 600 : 400 }}
                          >
                            {sub.label}
                          </button>
                        );
                      })}
                    </div>
                    {/* Bleaching score — shown when coral selected */}
                    {formData.routingCategory === "coral" && (
                      <div className="mt-3">
                        <p className="mb-2" style={{ fontFamily: "var(--font-mono)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-ink-2)" }}>
                          Bleaching score
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {BLEACH_OPTIONS.map((b) => (
                            <button
                              key={b.value}
                              type="button"
                              onClick={() => setFormData((prev) => ({ ...prev, bleachingScore: b.value }))}
                              className="rounded-sm px-4 py-2 font-sans text-sm transition-colors"
                              style={{ minHeight: 40, border: "1px solid var(--color-hairline)", background: formData.bleachingScore === b.value ? "var(--color-ink)" : "var(--color-paper)", color: formData.bleachingScore === b.value ? "var(--color-paper)" : "var(--color-ink)", cursor: "pointer" }}
                            >
                              {b.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>


      {errorMsg && (
        <p className="mb-4 text-sm" style={{ color: "var(--color-declining)" }}>{errorMsg}</p>
      )}

      <div className="flex gap-3 flex-wrap">
        <GhostBtn onClick={onBack} disabled={loading}>Back</GhostBtn>
        <PrimaryBtn onClick={handleSubmit} disabled={formData.photos.length === 0} loading={loading}>
          Submit sighting
        </PrimaryBtn>
      </div>
    </div>
  );
}



// ─── Step 3: Broadcast confirmation ──────────────────────────────────────────

function BroadcastConfirmation({
  submitResponse,
  formData,
  onAnother,
}: {
  submitResponse: SubmitResponse;
  formData: FormData;
  onAnother: () => void;
}) {
  const hasSeahorse = formData.species.some((s) => s.isSeahorse) || formData.routingCategory === "seahorse";
  const rc = formData.routingCategory;

  type PlatformRow = { name: string; description: string; delay: number };
  const allPlatformRows: PlatformRow[] = [
    { name: "iNaturalist", description: "World's largest nature observation network",            delay: 0 },
    { name: "GBIF",        description: "Global biodiversity database",                          delay: 400 },
    { name: "OBIS",        description: "Ocean biodiversity database",                           delay: 800 },
    ...(hasSeahorse          ? [{ name: "iSeahorse",  description: "Global seahorse network",              delay: 1200 }] : []),
    ...(rc === "whale_dolphin" ? [{ name: "Happywhale", description: "Cetacean photo ID database",          delay: 1400 }] : []),
    ...(rc === "whale_shark"   ? [{ name: "Sharkbook",  description: "Whale shark photo ID database",       delay: 1400 }] : []),
  ];

  const [visibleCount, setVisibleCount] = useState(0);
  const reducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    if (reducedMotion) {
      setVisibleCount(allPlatformRows.length);
      return;
    }
    allPlatformRows.forEach((row, i) => {
      setTimeout(() => {
        setVisibleCount((c) => Math.max(c, i + 1));
      }, row.delay);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const observationUrl = submitResponse.observationUrl;
  const siteSlug = formData.site?.slug;
  const siteName = formData.site?.name;

  return (
    <div>
      <h2
        className="mb-6"
        style={{
          fontFamily: "var(--font-serif)",
          fontWeight: 300,
          fontStyle: "italic",
          fontSize: "2.75rem",
          color: "var(--color-ink)",
        }}
      >
        Your sighting is on its way!
      </h2>

      <div
        aria-live="polite"
        aria-label="Platforms receiving your sighting"
        className="mb-8 space-y-3"
      >
        {allPlatformRows.map((row, i) => (
          <div
            key={row.name}
            className="flex items-start gap-2 text-sm transition-opacity"
            style={{
              opacity: i < visibleCount ? 1 : 0,
              fontFamily: "var(--font-sans)",
            }}
          >
            <span style={{ color: "var(--color-improving)", fontWeight: 700, marginTop: 1 }}>✓</span>
            <span>
              <span style={{ color: "var(--color-ink)", fontWeight: 600 }}>{row.name}</span>
              <span style={{ color: "var(--color-ink-2)", fontSize: 12 }}> — {row.description}</span>
            </span>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        {observationUrl && (
          <a
            href={observationUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block text-sm"
            style={{ color: "var(--color-ocean)", textDecoration: "underline" }}
          >
            Find your observation on iNaturalist
          </a>
        )}

        <div className="flex gap-3 flex-wrap mt-4">
          <GhostBtn onClick={onAnother}>Submit another sighting</GhostBtn>
          {siteSlug && siteName && (
            <a
              href={`/sites/${siteSlug}`}
              className="inline-flex items-center rounded-sm px-5 py-3 font-sans text-sm transition-colors"
              style={{
                background: "none",
                border: "1px solid var(--color-hairline)",
                color: "var(--color-ink)",
                minHeight: 44,
                textDecoration: "none",
              }}
            >
              Back to {siteName}
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Step 3: Routing picker ───────────────────────────────────────────────────

// ─── Equipment gate (survey mode pre-check) ───────────────────────────────────

const EQUIPMENT_ITEMS = [
  "Quadrat frame (1 m²)",
  "Transect tape (25 m)",
  "Underwater slate or dive slate app",
  "CoralWatch colour chart",
];

function EquipmentGate({ onProceed, onBack }: { onProceed: () => void; onBack: () => void }) {
  const [showShoppingList, setShowShoppingList] = useState(false);

  return (
    <div>
      <h2
        className="mb-2"
        style={{
          fontFamily: "var(--font-serif)",
          fontWeight: 300,
          fontStyle: "italic",
          fontSize: "1.75rem",
          color: "var(--color-ink)",
        }}
        tabIndex={-1}
        id="step-heading"
      >
        Before you start
      </h2>
      <p className="mb-6 text-sm" style={{ color: "var(--color-ink-2)" }}>
        A structured reef survey needs a few things. Make sure you have them before diving.
      </p>

      <ul
        className="mb-8 space-y-3"
        style={{ listStyle: "none", padding: 0, margin: "0 0 2rem 0" }}
      >
        {EQUIPMENT_ITEMS.map((item) => (
          <li key={item} className="flex items-start gap-3 text-sm" style={{ color: "var(--color-ink)" }}>
            <span
              style={{
                display: "inline-block",
                width: 20,
                height: 20,
                minWidth: 20,
                borderRadius: "50%",
                border: "1.5px solid var(--color-hairline)",
                marginTop: 1,
              }}
            />
            {item}
          </li>
        ))}
      </ul>

      <div className="flex flex-col gap-3">
        <PrimaryBtn onClick={onProceed}>I have everything — start survey</PrimaryBtn>
        <GhostBtn onClick={() => setShowShoppingList((v) => !v)}>
          {showShoppingList ? "Hide list" : "I do not have these yet"}
        </GhostBtn>
      </div>

      {showShoppingList && (
        <div
          className="mt-4 rounded-sm p-4 text-sm"
          style={{
            border: "1px solid var(--color-hairline)",
            background: "var(--color-paper)",
            color: "var(--color-ink)",
          }}
        >
          <p className="mb-3 font-medium">Gear to pick up before your next dive:</p>
          <ul style={{ listStyle: "disc", paddingLeft: "1.25rem", margin: 0 }}>
            {EQUIPMENT_ITEMS.map((item) => (
              <li key={item} className="mb-1">{item}</li>
            ))}
          </ul>
          <p className="mt-3" style={{ color: "var(--color-ink-2)" }}>
            Pick these up from your dive shop before your next dive.
          </p>
        </div>
      )}

      <button
        type="button"
        onClick={onBack}
        className="mt-6 text-sm"
        style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-ink-2)", padding: 0, textDecoration: "underline" }}
      >
        Back
      </button>
    </div>
  );
}

// ─── Mode selector ────────────────────────────────────────────────────────────

function ModeSelector({ onSelect }: { onSelect: (mode: Mode) => void }) {
  return (
    <div>
      {/* Hero photo */}
      <div className="mb-6 rounded-sm overflow-hidden" style={{ height: 220 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://d1qsp4j04beddk.cloudfront.net/OceanImageBank_TheOceanAgency_360_84.jpg"
          alt="Diver underwater photographing a reef"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Value prop */}
      <p className="mb-6 text-sm leading-relaxed" style={{ color: "var(--color-ink)" }}>
        There are dozens of marine conservation organizations that rely on diver observations for their work — tracking species populations, monitoring reef health, protecting critical habitats. Finding them yourself, registering accounts, learning each upload form... that adds up to 38 minutes per dive trip. Upload here and we handle all of it. 1 photo, a few seconds, and your sighting reaches the science.{" "}
        <a href="/learn" style={{ color: "var(--color-ocean)", textDecoration: "underline" }}>
          See which organizations receive your data.
        </a>
      </p>

      <h2
        className="mb-5"
        style={{
          fontFamily: "var(--font-serif)",
          fontWeight: 300,
          fontStyle: "italic",
          fontSize: "1.75rem",
          color: "var(--color-ink)",
        }}
        id="step-heading"
        tabIndex={-1}
      >
        What did you do on the dive?
      </h2>

      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={() => onSelect("sighting")}
          className="rounded-sm text-left p-5 transition-colors"
          style={{
            border: "1px solid var(--color-hairline)",
            background: "var(--color-paper)",
            cursor: "pointer",
          }}
        >
          <p className="text-sm font-bold mb-1" style={{ color: "var(--color-ink)" }}>
            I took a photo
          </p>
          <p className="text-sm" style={{ color: "var(--color-ink-2)" }}>
            A photo of a marine species, corals, or anything underwater.
          </p>
        </button>
        <button
          type="button"
          onClick={() => onSelect("survey")}
          className="rounded-sm text-left p-5 transition-colors"
          style={{
            border: "1px solid var(--color-hairline)",
            background: "var(--color-paper)",
            cursor: "pointer",
          }}
        >
          <p className="text-sm font-bold mb-1" style={{ color: "var(--color-ink)" }}>
            I ran a structured survey
          </p>
          <p className="text-sm" style={{ color: "var(--color-ink-2)" }}>
            You used a quadrat frame, transect tape, or CoralWatch chart on the reef.
          </p>
        </button>
      </div>
    </div>
  );
}

// ─── Survey step 2: metadata ──────────────────────────────────────────────────

const REEF_SLOPE_OPTIONS = ["", "Flat", "Slope", "Wall", "Crest"] as const;

function SurveyStep2Metadata({
  data,
  setData,
  onBack,
  onNext,
}: {
  data: ReefSurveyData;
  setData: React.Dispatch<React.SetStateAction<ReefSurveyData>>;
  onBack: () => void;
  onNext: () => void;
}) {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const field = (key: keyof ReefSurveyData) => ({
    value: data[key] as string,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setData((prev) => ({ ...prev, [key]: e.target.value })),
  });

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!data.date) errs.date = "Date is required.";
    if (!data.depthM || isNaN(Number(data.depthM))) errs.depthM = "Enter a valid depth.";
    if (!data.transectLengthM || isNaN(Number(data.transectLengthM))) errs.transectLengthM = "Enter transect length.";
    if (!data.numQuadrats || Number(data.numQuadrats) < 1) errs.numQuadrats = "At least 1 quadrat required.";
    if (!data.quadratSizeM2 || isNaN(Number(data.quadratSizeM2))) errs.quadratSizeM2 = "Enter quadrat size.";
    if (!data.pointsPerQuadrat || Number(data.pointsPerQuadrat) < 1) errs.pointsPerQuadrat = "At least 1 point per quadrat.";
    if (!data.observerEmail.trim()) errs.observerEmail = "Observer email is required.";
    return errs;
  };

  const handleNext = () => {
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    onNext();
  };

  const labelStyle = {
    fontFamily: "var(--font-mono)",
    fontSize: 11,
    textTransform: "uppercase" as const,
    letterSpacing: "0.08em",
    color: "var(--color-ink-2)",
    display: "block",
    marginBottom: 4,
  };
  const inputStyle = {
    border: "1px solid var(--color-hairline)",
    outline: "none",
    color: "var(--color-ink)",
    background: "var(--color-paper)",
    width: "100%",
    borderRadius: 2,
    padding: "0.75rem 1rem",
    fontFamily: "var(--font-sans)",
    fontSize: "1rem",
  };

  return (
    <div>
      <h2
        className="mb-2"
        style={{ fontFamily: "var(--font-serif)", fontWeight: 300, fontStyle: "italic", fontSize: "1.75rem", color: "var(--color-ink)" }}
        tabIndex={-1}
        id="step-heading"
      >
        Survey details
      </h2>
      <p className="mb-6 text-sm" style={{ color: "var(--color-ink-2)" }}>
        These fields set up the sample event in MERMAID. Fill them in before you
        forget the numbers from the dive.
      </p>

      <div className="space-y-4">
        <div>
          <label style={labelStyle}>Date</label>
          <input type="date" style={inputStyle} {...field("date")} />
          {errors.date && <p className="text-xs mt-1" style={{ color: "var(--color-declining)" }}>{errors.date}</p>}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label style={labelStyle}>Depth (m)</label>
            <input type="number" min="0" max="200" step="0.5" placeholder="e.g. 8" style={inputStyle} {...field("depthM")} />
            {errors.depthM && <p className="text-xs mt-1" style={{ color: "var(--color-declining)" }}>{errors.depthM}</p>}
          </div>
          <div>
            <label style={labelStyle}>Transect length (m)</label>
            <input type="number" min="1" max="200" step="1" placeholder="e.g. 25" style={inputStyle} {...field("transectLengthM")} />
            {errors.transectLengthM && <p className="text-xs mt-1" style={{ color: "var(--color-declining)" }}>{errors.transectLengthM}</p>}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label style={labelStyle}>Number of quadrats</label>
            <input type="number" min="1" max="100" step="1" placeholder="e.g. 5" style={inputStyle} {...field("numQuadrats")} />
            {errors.numQuadrats && <p className="text-xs mt-1" style={{ color: "var(--color-declining)" }}>{errors.numQuadrats}</p>}
          </div>
          <div>
            <label style={labelStyle}>Quadrat size (m²)</label>
            <input type="number" min="0.1" max="10" step="0.1" placeholder="e.g. 1" style={inputStyle} {...field("quadratSizeM2")} />
            {errors.quadratSizeM2 && <p className="text-xs mt-1" style={{ color: "var(--color-declining)" }}>{errors.quadratSizeM2}</p>}
          </div>
          <div>
            <label style={labelStyle}>Points per quadrat</label>
            <input type="number" min="1" max="200" step="1" placeholder="e.g. 25" style={inputStyle} {...field("pointsPerQuadrat")} />
            {errors.pointsPerQuadrat && <p className="text-xs mt-1" style={{ color: "var(--color-declining)" }}>{errors.pointsPerQuadrat}</p>}
          </div>
        </div>

        <div>
          <label style={labelStyle}>Reef slope (optional)</label>
          <select
            value={data.reefSlope}
            onChange={(e) => setData((prev) => ({ ...prev, reefSlope: e.target.value }))}
            style={{ ...inputStyle, appearance: "none" }}
          >
            {REEF_SLOPE_OPTIONS.map((o) => (
              <option key={o} value={o}>{o || "— not specified —"}</option>
            ))}
          </select>
        </div>

        <div>
          <label style={labelStyle}>Observer email</label>
          <input type="email" placeholder="e.g. you@example.com" style={inputStyle} {...field("observerEmail")} />
          <p className="text-xs mt-1" style={{ color: "var(--color-ink-2)" }}>
            Required by MERMAID to link the survey to your account.
          </p>
          {errors.observerEmail && <p className="text-xs mt-1" style={{ color: "var(--color-declining)" }}>{errors.observerEmail}</p>}
        </div>

        <div>
          <label style={labelStyle}>Notes (optional)</label>
          <textarea
            rows={3}
            placeholder="Visibility, current, unusual conditions..."
            value={data.notes}
            onChange={(e) => setData((prev) => ({ ...prev, notes: e.target.value }))}
            style={{ ...inputStyle, resize: "vertical" }}
          />
        </div>
      </div>

      <div className="flex gap-3 flex-wrap mt-6">
        <GhostBtn onClick={onBack}>Back</GhostBtn>
        <PrimaryBtn onClick={handleNext}>Continue</PrimaryBtn>
      </div>
    </div>
  );
}

// ─── Survey step 3: CoralWatch readings ───────────────────────────────────────

const GROWTH_FORMS = ["branching", "encrusting", "massive", "plate", "soft", "millepora"] as const;
const SHADE_LABELS: Record<number, string> = { 1: "1 — bleached", 2: "2 — pale", 3: "3 — moderate", 4: "4 — healthy" };

function SurveyStep3CoralWatch({
  data,
  setData,
  onBack,
  onNext,
}: {
  data: ReefSurveyData;
  setData: React.Dispatch<React.SetStateAction<ReefSurveyData>>;
  onBack: () => void;
  onNext: () => void;
}) {
  const [growthForm, setGrowthForm] = useState<string>(GROWTH_FORMS[0]);
  const [lightestShade, setLightestShade] = useState(1);
  const [darkestShade, setDarkestShade] = useState(4);
  const [addError, setAddError] = useState<string | null>(null);

  const addEntry = () => {
    if (darkestShade < lightestShade) {
      setAddError("Darkest shade must be equal to or darker than the lightest shade.");
      return;
    }
    setAddError(null);
    setData((prev) => ({
      ...prev,
      coralEntries: [...prev.coralEntries, { growthForm, lightestShade, darkestShade }],
    }));
  };

  const removeEntry = (i: number) => {
    setData((prev) => ({ ...prev, coralEntries: prev.coralEntries.filter((_, idx) => idx !== i) }));
  };

  const selectStyle = {
    border: "1px solid var(--color-hairline)",
    outline: "none",
    color: "var(--color-ink)",
    background: "var(--color-paper)",
    borderRadius: 2,
    padding: "0.5rem 0.75rem",
    fontFamily: "var(--font-sans)",
    fontSize: "0.875rem",
    appearance: "none" as const,
  };

  return (
    <div>
      <h2
        className="mb-2"
        style={{ fontFamily: "var(--font-serif)", fontWeight: 300, fontStyle: "italic", fontSize: "1.75rem", color: "var(--color-ink)" }}
        tabIndex={-1}
        id="step-heading"
      >
        CoralWatch readings
      </h2>
      <p className="mb-1 text-sm" style={{ color: "var(--color-ink-2)" }}>
        Optional. For each coral you examined during the survey, record the growth
        form and the lightest and darkest shade from the Coral Health Chart (1 =
        fully bleached, 4 = darkest healthy). CoralWatch recommends at least 20
        corals for a valid survey.
      </p>
      <p className="mb-6 text-sm" style={{ color: "var(--color-ink-2)", opacity: 0.7 }}>
        Skip this step if you did not bring a CoralWatch chart on the dive.
      </p>

      {/* Add entry row */}
      <div className="flex flex-wrap gap-2 mb-3 items-end">
        <div>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-ink-2)", marginBottom: 4 }}>
            Growth form
          </p>
          <select value={growthForm} onChange={(e) => setGrowthForm(e.target.value)} style={selectStyle}>
            {GROWTH_FORMS.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>
        <div>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-ink-2)", marginBottom: 4 }}>
            Lightest shade
          </p>
          <select value={lightestShade} onChange={(e) => setLightestShade(Number(e.target.value))} style={selectStyle}>
            {[1, 2, 3, 4].map((n) => <option key={n} value={n}>{SHADE_LABELS[n]}</option>)}
          </select>
        </div>
        <div>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-ink-2)", marginBottom: 4 }}>
            Darkest shade
          </p>
          <select value={darkestShade} onChange={(e) => setDarkestShade(Number(e.target.value))} style={selectStyle}>
            {[1, 2, 3, 4].map((n) => <option key={n} value={n}>{SHADE_LABELS[n]}</option>)}
          </select>
        </div>
        <button
          type="button"
          onClick={addEntry}
          className="rounded-sm px-4 py-2 text-sm font-sans"
          style={{
            background: "var(--color-ink)",
            color: "var(--color-paper)",
            border: "none",
            cursor: "pointer",
            minHeight: 38,
          }}
        >
          Add coral
        </button>
      </div>

      {addError && <p className="text-xs mb-3" style={{ color: "var(--color-declining)" }}>{addError}</p>}

      {/* Logged entries */}
      {data.coralEntries.length > 0 && (
        <div
          className="overflow-hidden rounded-[1rem] mb-4"
          style={{ border: "1px solid var(--color-hairline)" }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "rgba(14,28,40,0.03)" }}>
                <th style={{ padding: "0.5rem 0.75rem", textAlign: "left", fontFamily: "var(--font-mono)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-ink-2)", fontWeight: 600 }}>Growth form</th>
                <th style={{ padding: "0.5rem 0.75rem", textAlign: "left", fontFamily: "var(--font-mono)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-ink-2)", fontWeight: 600 }}>Lightest</th>
                <th style={{ padding: "0.5rem 0.75rem", textAlign: "left", fontFamily: "var(--font-mono)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-ink-2)", fontWeight: 600 }}>Darkest</th>
                <th style={{ width: 32 }}></th>
              </tr>
            </thead>
            <tbody>
              {data.coralEntries.map((e, i) => (
                <tr key={i} style={{ borderTop: "1px solid var(--color-hairline)" }}>
                  <td style={{ padding: "0.5rem 0.75rem", color: "var(--color-ink)", textTransform: "capitalize" }}>{e.growthForm}</td>
                  <td style={{ padding: "0.5rem 0.75rem", color: "var(--color-ink-2)" }}>{e.lightestShade}</td>
                  <td style={{ padding: "0.5rem 0.75rem", color: "var(--color-ink-2)" }}>{e.darkestShade}</td>
                  <td style={{ padding: "0.5rem 0.5rem" }}>
                    <button
                      type="button"
                      onClick={() => removeEntry(i)}
                      style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-ink-2)", fontSize: 16, lineHeight: 1 }}
                      aria-label="Remove"
                    >
                      ×
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {data.coralEntries.length > 0 && data.coralEntries.length < 20 && (
        <p className="text-xs mb-4" style={{ color: "var(--color-ink-2)", opacity: 0.7 }}>
          {data.coralEntries.length} coral{data.coralEntries.length > 1 ? "s" : ""} recorded.
          CoralWatch needs 20 for a valid survey — add more or continue and we will note the partial count.
        </p>
      )}
      {data.coralEntries.length >= 20 && (
        <p className="text-xs mb-4" style={{ color: "var(--color-improving)" }}>
          {data.coralEntries.length} corals recorded. That is enough for a valid CoralWatch survey.
        </p>
      )}

      <div className="flex gap-3 flex-wrap">
        <GhostBtn onClick={onBack}>Back</GhostBtn>
        <PrimaryBtn onClick={onNext}>
          {data.coralEntries.length === 0 ? "Skip CoralWatch" : "Continue"}
        </PrimaryBtn>
      </div>
    </div>
  );
}

// ─── Survey step 4: review + submit ──────────────────────────────────────────

function SurveyStep4Submit({
  data,
  onBack,
  onSuccess,
}: {
  data: ReefSurveyData;
  onBack: () => void;
  onSuccess: (res: SurveySubmitResponse) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const coralWatchCount = data.coralEntries.length;
  const platforms = [
    "MERMAID (queued for import)",
    ...(coralWatchCount > 0 ? [`CoralWatch (${coralWatchCount} coral${coralWatchCount > 1 ? "s" : ""} recorded)`] : []),
  ];

  const handleSubmit = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const body = {
        siteId: data.site?.id ?? "unknown",
        siteName: data.site?.name ?? "Not specified",
        siteLat: String(data.site?.lat ?? 0),
        siteLng: String(data.site?.lng ?? 0),
        date: data.date,
        depthM: data.depthM,
        transectLengthM: data.transectLengthM,
        numQuadrats: data.numQuadrats,
        quadratSizeM2: data.quadratSizeM2,
        pointsPerQuadrat: data.pointsPerQuadrat,
        reefSlope: data.reefSlope,
        observerEmail: data.observerEmail,
        notes: data.notes,
        coralEntries: data.coralEntries,
      };
      const res = await fetch("/api/submit-reef-survey", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = (await res.json()) as SurveySubmitResponse;
      if (!res.ok) {
        setErrorMsg(json.error ?? json.message ?? "Submission failed. Please try again.");
      } else {
        onSuccess(json);
      }
    } catch {
      setErrorMsg("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const dt = (label: string, value: string) => (
    <div className="flex gap-2">
      <dt style={{ color: "var(--color-ink-2)", minWidth: 110, fontFamily: "var(--font-mono)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</dt>
      <dd style={{ color: "var(--color-ink)" }}>{value}</dd>
    </div>
  );

  return (
    <div>
      <h2
        className="mb-6"
        style={{ fontFamily: "var(--font-serif)", fontWeight: 300, fontStyle: "italic", fontSize: "1.75rem", color: "var(--color-ink)" }}
        tabIndex={-1}
        id="step-heading"
      >
        Review and submit
      </h2>

      <div className="rounded-sm p-4 mb-6" style={{ border: "1px solid var(--color-hairline)", background: "var(--color-paper)" }}>
        <dl className="space-y-2 text-sm">
          {dt("Site", data.site?.name ?? "Not specified")}
          {dt("Date", data.date)}
          {dt("Depth", `${data.depthM} m`)}
          {dt("Transect", `${data.transectLengthM} m`)}
          {dt("Quadrats", `${data.numQuadrats} × ${data.quadratSizeM2} m²`)}
          {dt("Points/quadrat", data.pointsPerQuadrat)}
          {data.reefSlope && dt("Reef slope", data.reefSlope)}
          {dt("Observer", data.observerEmail)}
          {coralWatchCount > 0 && dt("CoralWatch", `${coralWatchCount} corals recorded`)}
        </dl>
      </div>

      <div className="mb-6">
        <p className="mb-3" style={{ fontFamily: "var(--font-mono)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-ink-2)" }}>
          Submitting to
        </p>
        <ul className="space-y-1 text-sm" style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {platforms.map((p) => <li key={p} style={{ color: "var(--color-ink)" }}>{p}</li>)}
        </ul>
      </div>

      <div
        className="rounded-sm p-4 mb-6 text-sm"
        style={{ background: "rgba(14,28,40,0.03)", border: "1px solid var(--color-hairline)", color: "var(--color-ink-2)" }}
      >
        Upload your quadrat photos directly to your MERMAID project at{" "}
        <a href="https://app.datamermaid.org" target="_blank" rel="noopener noreferrer" style={{ color: "var(--color-ocean)" }}>
          app.datamermaid.org
        </a>{" "}
        after submitting. MERMAID AI will classify the points — your survey metadata
        will be in the queue for you to match up.
      </div>

      {errorMsg && <p className="mb-4 text-sm" style={{ color: "var(--color-declining)" }}>{errorMsg}</p>}

      <div className="flex gap-3 flex-wrap">
        <GhostBtn onClick={onBack} disabled={loading}>Back</GhostBtn>
        <PrimaryBtn onClick={handleSubmit} loading={loading}>Submit survey</PrimaryBtn>
      </div>
    </div>
  );
}

// ─── Survey confirmation ──────────────────────────────────────────────────────

function SurveyConfirmation({
  data,
  onAnother,
}: {
  data: ReefSurveyData;
  onAnother: () => void;
}) {
  return (
    <div>
      <h2
        className="mb-4"
        style={{ fontFamily: "var(--font-serif)", fontWeight: 300, fontStyle: "italic", fontSize: "1.875rem", color: "var(--color-ink)" }}
      >
        Survey logged.
      </h2>
      <p className="text-sm mb-6" style={{ color: "var(--color-ink-2)" }}>
        Your survey metadata has been recorded and Josie has been alerted. The next
        step is to upload your quadrat photos to MERMAID so the AI can classify them.
      </p>
      <a
        href="https://app.datamermaid.org"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center rounded-sm px-5 py-3 text-sm font-sans font-medium mb-4"
        style={{
          background: "var(--color-brand-yellow)",
          color: "var(--color-ink)",
          textDecoration: "none",
          display: "inline-block",
        }}
      >
        Upload photos to MERMAID
      </a>
      <div className="mt-4">
        <GhostBtn onClick={onAnother}>Submit another survey</GhostBtn>
      </div>
      {data.coralEntries.length > 0 && (
        <p className="mt-4 text-xs" style={{ color: "var(--color-ink-2)", opacity: 0.7 }}>
          {data.coralEntries.length} CoralWatch reading{data.coralEntries.length > 1 ? "s" : ""} queued.
        </p>
      )}
    </div>
  );
}

// ─── Main wizard (inner — reads search params) ────────────────────────────────

const SURVEY_STEP_LABELS = ["Dive site", "Survey details", "CoralWatch", "Submit"];

function UploadWizardInner() {
  const searchParams = useSearchParams();
  const prefilledSlug = searchParams.get("site");

  const headingRef = useRef<HTMLElement | null>(null);

  // Mode selection
  const [mode, setMode] = useState<Mode | null>(null);
  const [showEquipmentGate, setShowEquipmentGate] = useState(false);

  // Sighting mode state
  const [step, setStep] = useState<WizardStep>(1);
  const [submitResponse, setSubmitResponse] = useState<SubmitResponse | null>(null);

  const [formData, setFormData] = useState<FormData>(() => {
    const prefilled = prefilledSlug
      ? ALL_SITES.find((s) => s.slug === prefilledSlug || s.id === prefilledSlug) ?? null
      : null;
    return {
      site: prefilled,
      photos: [],
      date: todayIso(),
      category: null,
      species: [],
      depthM: "",
      tempC: "",
      bleachingScore: null,
      notes: "",
      routingCategory: null,
      speciesHint: null,
    };
  });

  // Survey mode state
  const [surveyStep, setSurveyStep] = useState<SurveyStep>(1);
  const [surveyData, setSurveyData] = useState<ReefSurveyData>(() => {
    const prefilled = prefilledSlug
      ? ALL_SITES.find((s) => s.slug === prefilledSlug || s.id === prefilledSlug) ?? null
      : null;
    return {
      site: prefilled,
      date: todayIso(),
      depthM: "",
      transectLengthM: "25",
      numQuadrats: "5",
      quadratSizeM2: "1",
      pointsPerQuadrat: "25",
      reefSlope: "",
      observerEmail: "",
      notes: "",
      coralEntries: [],
    };
  });
  const [surveyResponse, setSurveyResponse] = useState<SurveySubmitResponse | null>(null);

  // Auto-advance to step 2 if site was pre-filled from URL (sighting mode)
  useEffect(() => {
    if (prefilledSlug && formData.site) {
      setStep(2);
    }
    // Only on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const focusHeading = () => {
    setTimeout(() => {
      const el = document.getElementById("step-heading");
      if (el) el.focus();
    }, 50);
  };

  const goToStep = (s: WizardStep) => { setStep(s); focusHeading(); };
  const goToSurveyStep = (s: SurveyStep) => { setSurveyStep(s); focusHeading(); };

  const handleAnother = () => {
    setFormData((prev) => ({
      site: prev.site,
      photos: [],
      date: todayIso(),
      category: null,
      species: [],
      depthM: "",
      tempC: "",
      bleachingScore: null,
      notes: "",
      routingCategory: null,
      speciesHint: null,
    }));
    setSubmitResponse(null);
    setStep(1);
    setMode(null);
  };

  const handleSurveyAnother = () => {
    setSurveyData((prev) => ({
      site: prev.site,
      date: todayIso(),
      depthM: "",
      transectLengthM: "25",
      numQuadrats: "5",
      quadratSizeM2: "1",
      pointsPerQuadrat: "25",
      reefSlope: "",
      observerEmail: prev.observerEmail,
      notes: "",
      coralEntries: [],
    }));
    setSurveyResponse(null);
    setSurveyStep(1);
    setMode(null);
    setShowEquipmentGate(false);
  };

  // Mode not yet chosen
  if (mode === null) {
    return (
      <div ref={headingRef as React.RefObject<HTMLDivElement>}>
        <ModeSelector
          onSelect={(m) => {
            setMode(m);
            if (m === "survey") {
              setShowEquipmentGate(true);
            }
            focusHeading();
          }}
        />
      </div>
    );
  }

  // Equipment gate for survey mode
  if (mode === "survey" && showEquipmentGate) {
    return (
      <div ref={headingRef as React.RefObject<HTMLDivElement>}>
        <EquipmentGate
          onProceed={() => { setShowEquipmentGate(false); focusHeading(); }}
          onBack={() => { setMode(null); setShowEquipmentGate(false); focusHeading(); }}
        />
      </div>
    );
  }

  // ── Survey mode ─────────────────────────────────────────────────────────────
  if (mode === "survey") {
    if (surveyResponse) {
      return (
        <div ref={headingRef as React.RefObject<HTMLDivElement>}>
          <SurveyConfirmation data={surveyData} onAnother={handleSurveyAnother} />
        </div>
      );
    }
    return (
      <div ref={headingRef as React.RefObject<HTMLDivElement>}>
        <div className="mb-8">
          <div className="flex items-center">
            {SURVEY_STEP_LABELS.map((label, i) => {
              const stepNum = (i + 1) as SurveyStep;
              const completed = surveyStep > stepNum;
              const active = surveyStep === stepNum;
              return (
                <div key={label} className="flex items-center flex-1 last:flex-none">
                  <div className="flex flex-col items-center">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-mono transition-colors"
                      style={{
                        background: completed ? "var(--color-ink)" : active ? "var(--color-brand-yellow)" : "var(--color-paper)",
                        color: completed ? "var(--color-paper)" : active ? "var(--color-ink)" : "var(--color-ink-2)",
                        border: completed || active ? "none" : "1px solid var(--color-hairline)",
                        minWidth: 28,
                        minHeight: 28,
                      }}
                    >
                      {completed ? "✓" : stepNum}
                    </div>
                    <span className="mt-1 text-center" style={{ fontFamily: "var(--font-mono)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-ink-2)", whiteSpace: "nowrap" }}>
                      {label}
                    </span>
                  </div>
                  {i < SURVEY_STEP_LABELS.length - 1 && (
                    <div className="flex-1 mx-2 transition-colors" style={{ height: 1, background: completed ? "var(--color-ink)" : "var(--color-hairline)", marginBottom: 18 }} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {surveyStep === 1 && (
          <Step1SiteSearch
            formData={{ ...formData, site: surveyData.site }}
            onSelectSite={(site) => setSurveyData((prev) => ({ ...prev, site }))}
            onSkip={() => goToSurveyStep(2)}
            onNext={() => goToSurveyStep(2)}
          />
        )}
        {surveyStep === 2 && (
          <SurveyStep2Metadata
            data={surveyData}
            setData={setSurveyData}
            onBack={() => goToSurveyStep(1)}
            onNext={() => goToSurveyStep(3)}
          />
        )}
        {surveyStep === 3 && (
          <SurveyStep3CoralWatch
            data={surveyData}
            setData={setSurveyData}
            onBack={() => goToSurveyStep(2)}
            onNext={() => goToSurveyStep(4)}
          />
        )}
        {surveyStep === 4 && (
          <SurveyStep4Submit
            data={surveyData}
            onBack={() => goToSurveyStep(3)}
            onSuccess={(res) => { setSurveyResponse(res); focusHeading(); }}
          />
        )}
      </div>
    );
  }

  // ── Sighting mode ────────────────────────────────────────────────────────────
  return (
    <div ref={headingRef as React.RefObject<HTMLDivElement>}>
      {step < 3 && <StepIndicator currentStep={step as 1 | 2} />}

      {step === 1 && (
        <Step1SiteSearch
          formData={formData}
          onSelectSite={(site) => setFormData((prev) => ({ ...prev, site }))}
          onSkip={() => goToStep(2)}
          onNext={() => goToStep(2)}
        />
      )}

      {step === 2 && (
        <Step2Sighting
          formData={formData}
          setFormData={setFormData}
          onBack={() => goToStep(1)}
          onGoBackToSiteSearch={() => goToStep(1)}
          onSuccess={(res) => {
            setSubmitResponse(res);
            goToStep(3);
          }}
        />
      )}

      {step === 3 && submitResponse && (
        <BroadcastConfirmation
          submitResponse={submitResponse}
          formData={formData}
          onAnother={handleAnother}
        />
      )}
    </div>
  );
}

// ─── Public export ─────────────────────────────────────────────────────────────

export default function UploadWizard() {
  return (
    <Suspense fallback={<div className="py-8 text-sm" style={{ color: "var(--color-ink-2)" }}>Loading...</div>}>
      <UploadWizardInner />
    </Suspense>
  );
}

"use client";

import { useState, useRef, useCallback, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import sitesRaw from "@/data/sites.json";

// ─── Types ────────────────────────────────────────────────────────────────────

type Category = "fish" | "coral" | "other";
type BleachingScore = "healthy" | "pale" | "bleached" | "dead";
type WizardStep = 1 | 2 | 3 | 4;

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

// Lightweight EXIF date reader (no exifr in package.json)
async function readExifDate(file: File): Promise<string | null> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const buf = e.target?.result as ArrayBuffer;
        const view = new DataView(buf);
        let offset = 2;
        while (offset < view.byteLength - 4) {
          const marker = view.getUint16(offset);
          const length = view.getUint16(offset + 2);
          if (marker === 0xffe1) {
            const header = new TextDecoder().decode(new Uint8Array(buf, offset + 4, 6));
            if (header.startsWith("Exif")) {
              const tiffStart = offset + 10;
              const tv = new DataView(buf, tiffStart);
              const le = tv.getUint16(0) === 0x4949;
              const ifd0 = tv.getUint32(4, le);
              const nEntries = tv.getUint16(ifd0, le);
              for (let i = 0; i < nEntries; i++) {
                const e0 = ifd0 + 2 + i * 12;
                const tag = tv.getUint16(e0, le);
                if (tag === 0x9003 || tag === 0x0132) {
                  const vOff = tv.getUint32(e0 + 8, le);
                  const ds = new TextDecoder().decode(new Uint8Array(buf, tiffStart + vOff, 10));
                  const iso = ds.replace(/^(\d{4}):(\d{2}):(\d{2})$/, "$1-$2-$3");
                  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) { resolve(iso); return; }
                }
              }
            }
          }
          if (length < 2) break;
          offset += 2 + length;
        }
      } catch { /* ignore */ }
      resolve(null);
    };
    reader.readAsArrayBuffer(file.slice(0, 131072));
  });
}

// ─── Step indicator ──────────────────────────────────────────────────────────

const STEP_LABELS = ["Dive site", "Your sighting", "Submit"];

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
  onNext,
}: {
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  onBack: () => void;
  onNext: () => void;
}) {
  const [dragging, setDragging] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [speciesQuery, setSpeciesQuery] = useState("");
  const [taxonSuggestions, setTaxonSuggestions] = useState<TaxonSuggestion[]>([]);
  const [speciesDropdownOpen, setSpeciesDropdownOpen] = useState(false);
  const [speciesError, setSpeciesError] = useState<string | null>(null);
  const [charCount, setCharCount] = useState(formData.notes.length);
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

      // Read EXIF date from first photo
      if (incoming.length > 0 && !formData.date) {
        const exifDate = await readExifDate(incoming[0]);
        if (exifDate) {
          setFormData((prev) => ({ ...prev, date: exifDate }));
        }
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
      bleachingScore: c !== "coral" ? null : prev.bleachingScore,
    }));
  };

  const CAT_OPTIONS: { value: Category; label: string }[] = [
    { value: "fish", label: "Fish or marine life" },
    { value: "coral", label: "Coral" },
    { value: "other", label: "Not sure / something else" },
  ];

  const BLEACH_OPTIONS: { value: BleachingScore; label: string }[] = [
    { value: "healthy", label: "Healthy" },
    { value: "pale", label: "Pale" },
    { value: "bleached", label: "Bleached" },
    { value: "dead", label: "Dead" },
  ];

  const validateAndNext = () => {
    if (formData.photos.length === 0) {
      setPhotoError("Please add at least 1 photo.");
      return;
    }
    onNext();
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
          {CAT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setCategory(opt.value)}
              className="rounded-sm px-4 text-left font-sans text-sm transition-colors"
              style={{
                minHeight: 60,
                border:
                  formData.category === opt.value
                    ? "2px solid var(--color-brand-yellow)"
                    : "1px solid var(--color-hairline)",
                background:
                  formData.category === opt.value
                    ? "rgba(246,199,0,0.05)"
                    : "var(--color-paper)",
                color: "var(--color-ink)",
                cursor: "pointer",
                fontWeight: formData.category === opt.value ? 500 : 400,
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Coral fields */}
        {formData.category === "coral" && (
          <div className="mt-4 space-y-4">
            <div>
              <label
                htmlFor="depth-m"
                className="block mb-1 text-sm"
                style={{ color: "var(--color-ink-2)", fontFamily: "var(--font-mono)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em" }}
              >
                Depth (m)
              </label>
              <input
                id="depth-m"
                type="number"
                min="0"
                max="200"
                step="0.5"
                value={formData.depthM}
                onChange={(e) => setFormData((prev) => ({ ...prev, depthM: e.target.value }))}
                placeholder="Depth (m)"
                className="w-full rounded-sm px-4 py-3 font-sans text-sm"
                style={{
                  border: "1px solid var(--color-hairline)",
                  outline: "none",
                  color: "var(--color-ink)",
                  background: "var(--color-paper)",
                }}
              />
            </div>
            <div>
              <p
                className="mb-2 text-sm"
                style={{ color: "var(--color-ink-2)", fontFamily: "var(--font-mono)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em" }}
              >
                Bleaching score
              </p>
              <div className="flex flex-wrap gap-2">
                {BLEACH_OPTIONS.map((b) => (
                  <button
                    key={b.value}
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, bleachingScore: b.value }))}
                    className="rounded-sm px-4 py-2 font-sans text-sm transition-colors"
                    style={{
                      minHeight: 44,
                      border: "1px solid var(--color-hairline)",
                      background:
                        formData.bleachingScore === b.value ? "var(--color-ink)" : "var(--color-paper)",
                      color:
                        formData.bleachingScore === b.value ? "var(--color-paper)" : "var(--color-ink)",
                      cursor: "pointer",
                    }}
                  >
                    {b.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Species autocomplete */}
      <section className="mb-6">
        <label
          htmlFor="species-input"
          className="block mb-2 text-sm"
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            color: "var(--color-ink-2)",
          }}
        >
          Species name (optional)
        </label>

        {formData.species.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {formData.species.map((chip, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 rounded-sm px-3 py-1 text-sm font-sans"
                style={{
                  background: "var(--color-hairline)",
                  color: "var(--color-ink)",
                }}
              >
                {chip.displayName}
                {chip.isSeahorse && (
                  <span
                    className="ml-1"
                    style={{
                      fontSize: 11,
                      color: "var(--color-improving)",
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    + iSeahorse
                  </span>
                )}
                <button
                  type="button"
                  aria-label={`Remove ${chip.displayName}`}
                  onClick={() => removeChip(i)}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: "0 2px",
                    color: "var(--color-ink-2)",
                    fontSize: 14,
                    lineHeight: 1,
                  }}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}

        <div className="relative">
          <input
            id="species-input"
            type="text"
            value={speciesQuery}
            onChange={(e) => handleSpeciesInput(e.target.value)}
            onBlur={() => setTimeout(() => setSpeciesDropdownOpen(false), 150)}
            onKeyDown={(e) => {
              if (e.key === "Enter") { e.preventDefault(); commitFreeTextChip(); }
            }}
            placeholder="Species name (optional)"
            className="w-full rounded-sm px-4 py-3 font-sans text-sm"
            style={{
              border: "1px solid var(--color-hairline)",
              outline: "none",
              color: "var(--color-ink)",
              background: "var(--color-paper)",
            }}
            autoComplete="off"
          />
          {speciesDropdownOpen && taxonSuggestions.length > 0 && (
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
              {taxonSuggestions.slice(0, 6).map((t) => (
                <li key={t.taxonId}>
                  <button
                    type="button"
                    onMouseDown={() => selectTaxon(t)}
                    className="w-full text-left px-4 py-3 font-sans text-sm"
                    style={{
                      background: "none",
                      border: "none",
                      borderBottom: "1px solid var(--color-hairline)",
                      cursor: "pointer",
                      color: "var(--color-ink)",
                      minHeight: 44,
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                    }}
                  >
                    <span className="font-medium">{t.commonName ?? t.scientificName}</span>
                    {t.commonName && (
                      <span style={{ fontStyle: "italic", color: "var(--color-ink-2)", fontSize: 12 }}>
                        {t.scientificName}
                      </span>
                    )}
                    {t.isSeahorse && (
                      <span style={{ fontSize: 11, color: "var(--color-improving)", fontFamily: "var(--font-mono)" }}>
                        + iSeahorse
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        {speciesError && (
          <p className="text-sm mt-1" style={{ color: "var(--color-declining)" }}>{speciesError}</p>
        )}
        <p className="text-sm mt-1" style={{ color: "var(--color-ink-2)", fontSize: 12 }}>
          Leave blank if unsure. iNaturalist experts will help identify from your photo.
        </p>
      </section>

      {/* Optional fields */}
      <section className="mb-6 space-y-4">
        <div>
          <label
            htmlFor="sea-temp"
            className="block mb-1 text-sm"
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "var(--color-ink-2)",
            }}
          >
            Sea temperature (°C, optional)
          </label>
          <input
            id="sea-temp"
            type="number"
            min="0"
            max="40"
            step="0.5"
            value={formData.tempC}
            onChange={(e) => setFormData((prev) => ({ ...prev, tempC: e.target.value }))}
            placeholder="Sea temperature (°C)"
            className="w-full rounded-sm px-4 py-3 font-sans text-sm"
            style={{
              border: "1px solid var(--color-hairline)",
              outline: "none",
              color: "var(--color-ink)",
              background: "var(--color-paper)",
            }}
          />
        </div>
        <div>
          <label
            htmlFor="notes"
            className="block mb-1 text-sm"
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "var(--color-ink-2)",
            }}
          >
            Notes (optional)
          </label>
          <textarea
            id="notes"
            maxLength={280}
            value={formData.notes}
            onChange={(e) => {
              setFormData((prev) => ({ ...prev, notes: e.target.value }));
              setCharCount(e.target.value.length);
            }}
            placeholder="Notes (optional)"
            rows={3}
            className="w-full rounded-sm px-4 py-3 font-sans text-sm"
            style={{
              border: "1px solid var(--color-hairline)",
              outline: "none",
              color: "var(--color-ink)",
              background: "var(--color-paper)",
              resize: "vertical",
            }}
          />
          <p className="text-right mt-1" style={{ fontSize: 12, color: "var(--color-ink-2)", fontFamily: "var(--font-mono)" }}>
            {charCount} / 280
          </p>
        </div>
      </section>

      <div className="flex gap-3 flex-wrap">
        <GhostBtn onClick={onBack}>Back</GhostBtn>
        <PrimaryBtn onClick={validateAndNext}>Continue</PrimaryBtn>
      </div>
    </div>
  );
}

// ─── Step 3: Review + identity gate + submit ──────────────────────────────────

function Step3Submit({
  formData,
  onBack,
  onSuccess,
}: {
  formData: FormData;
  onBack: () => void;
  onSuccess: (res: SubmitResponse) => void;
}) {
  const [identityMode, setIdentityMode] = useState<"guest" | "inat">("guest");
  const [inatNote, setInatNote] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const hasSeahorse = formData.species.some((s) => s.isSeahorse);
  const coralWatchEligible =
    formData.category === "coral" &&
    formData.depthM !== "" &&
    formData.bleachingScore !== null;

  const platforms = [
    "iNaturalist",
    "GBIF (via iNaturalist)",
    "OBIS (via iNaturalist)",
    ...(hasSeahorse ? ["iSeahorse"] : []),
    ...(coralWatchEligible ? ["CoralWatch (weekly batch)"] : []),
  ];

  const canSubmit = formData.photos.length > 0;

  const handleSubmit = async () => {
    if (!canSubmit) {
      setErrorMsg("Please add at least 1 photo before submitting.");
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

      fd.append("category", formData.category ?? "other");
      fd.append("observedOn", formData.date);

      // Species handling — multi-species
      const matchedTaxonIds: number[] = [];
      const freeTextNames: string[] = [];
      let hasSeahorseTaxon = false;

      for (const chip of formData.species) {
        if (chip.taxonId) {
          matchedTaxonIds.push(chip.taxonId);
          if (chip.isSeahorse) hasSeahorseTaxon = true;
        } else {
          freeTextNames.push(chip.displayName);
        }
      }

      if (matchedTaxonIds.length > 0) {
        fd.append("taxonIds", matchedTaxonIds.join(","));
      }
      if (freeTextNames.length > 0) {
        fd.append("freeTextSpecies", freeTextNames.join(", "));
      }
      fd.append("isSeahorse", String(hasSeahorseTaxon || hasSeahorse));
      fd.append("needsReview", String(freeTextNames.length > 0));

      if (formData.depthM) fd.append("depthM", formData.depthM);
      if (formData.tempC) fd.append("tempC", formData.tempC);
      if (formData.bleachingScore) fd.append("bleachingScore", formData.bleachingScore);
      if (formData.notes.trim()) fd.append("notes", formData.notes.trim());

      // Add display name for Telegram alert
      const speciesDisplay = formData.species.map((s) => s.displayName).join(", ") || "Unknown";
      fd.append("speciesDisplay", speciesDisplay);

      for (const p of formData.photos) fd.append("photos", p);

      const res = await fetch("/api/submit-sighting", { method: "POST", body: fd });
      const data = (await res.json()) as SubmitResponse;

      if (!res.ok) {
        setErrorMsg(data.error ?? data.message ?? "Submission failed. Please try again.");
      } else {
        onSuccess(data);
      }
    } catch {
      setErrorMsg("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2
        className="mb-6"
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
        Review and submit
      </h2>

      {/* Summary */}
      <div
        className="rounded-sm p-4 mb-6"
        style={{ border: "1px solid var(--color-hairline)", background: "var(--color-paper)" }}
      >
        <dl className="space-y-2 text-sm">
          <div className="flex gap-2">
            <dt style={{ color: "var(--color-ink-2)", minWidth: 80, fontFamily: "var(--font-mono)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em" }}>Site</dt>
            <dd style={{ color: "var(--color-ink)" }}>{formData.site?.name ?? "Not specified"}</dd>
          </div>
          <div className="flex gap-2">
            <dt style={{ color: "var(--color-ink-2)", minWidth: 80, fontFamily: "var(--font-mono)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em" }}>Category</dt>
            <dd style={{ color: "var(--color-ink)", textTransform: "capitalize" }}>{formData.category ?? "Not specified"}</dd>
          </div>
          {formData.species.length > 0 && (
            <div className="flex gap-2">
              <dt style={{ color: "var(--color-ink-2)", minWidth: 80, fontFamily: "var(--font-mono)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em" }}>Species</dt>
              <dd style={{ color: "var(--color-ink)" }}>{formData.species.map((s) => s.displayName).join(", ")}</dd>
            </div>
          )}
          {formData.depthM && (
            <div className="flex gap-2">
              <dt style={{ color: "var(--color-ink-2)", minWidth: 80, fontFamily: "var(--font-mono)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em" }}>Depth</dt>
              <dd style={{ color: "var(--color-ink)" }}>{formData.depthM} m</dd>
            </div>
          )}
          <div className="flex gap-2">
            <dt style={{ color: "var(--color-ink-2)", minWidth: 80, fontFamily: "var(--font-mono)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em" }}>Date</dt>
            <dd style={{ color: "var(--color-ink)" }}>{formData.date}</dd>
          </div>
        </dl>
        {formData.photos.length > 0 && (
          <div className="flex gap-2 mt-3">
            {formData.photos.slice(0, 3).map((f, i) => {
              const ext = f.name.split(".").pop()?.toLowerCase() ?? "";
              const isHeic = HEIC_EXTS.has(ext);
              if (isHeic) return (
                <div key={i} className="w-16 h-16 rounded flex items-center justify-center text-center" style={{ background: "var(--color-hairline)", fontSize: 9, color: "var(--color-ink-2)" }}>
                  HEIC
                </div>
              );
              return <ConfirmThumb key={i} file={f} />;
            })}
          </div>
        )}
      </div>

      {/* Platforms */}
      <div className="mb-6">
        <p
          className="mb-3"
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            color: "var(--color-ink-2)",
          }}
        >
          Submitting to
        </p>
        <ul className="space-y-1 text-sm" style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {platforms.map((p) => (
            <li key={p} style={{ color: "var(--color-ink)" }}>{p}</li>
          ))}
        </ul>
      </div>

      {/* Identity gate */}
      <div className="mb-6">
        <p
          className="mb-3"
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            color: "var(--color-ink-2)",
          }}
        >
          Submit as
        </p>
        <div className="space-y-3">
          <label className="flex items-center gap-3 cursor-pointer" style={{ minHeight: 44 }}>
            <input
              type="radio"
              name="identity"
              value="guest"
              checked={identityMode === "guest"}
              onChange={() => { setIdentityMode("guest"); setInatNote(false); }}
              className="w-4 h-4"
            />
            <span className="text-sm" style={{ color: "var(--color-ink)" }}>
              Submit as guest (via Scuba Season)
            </span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer" style={{ minHeight: 44 }}>
            <input
              type="radio"
              name="identity"
              value="inat"
              checked={identityMode === "inat"}
              onChange={() => { setIdentityMode("inat"); setInatNote(true); }}
              className="w-4 h-4"
            />
            <span className="text-sm" style={{ color: "var(--color-ink)" }}>
              Sign in with iNaturalist
            </span>
          </label>
        </div>
        {inatNote && (
          <p
            className="mt-3 text-sm rounded-sm p-3"
            style={{
              background: "rgba(14,79,110,0.05)",
              border: "1px solid var(--color-hairline)",
              color: "var(--color-ink-2)",
            }}
          >
            iNaturalist sign-in will be available from August 2026 when our API registration is complete. Your sighting will be submitted via the Scuba Season account in the meantime.
          </p>
        )}
      </div>

      {!canSubmit && (
        <p className="mb-4 text-sm" style={{ color: "var(--color-declining)" }}>
          Please add at least 1 photo before submitting.
        </p>
      )}

      {errorMsg && (
        <p className="mb-4 text-sm" style={{ color: "var(--color-declining)" }}>{errorMsg}</p>
      )}

      <div className="flex gap-3 flex-wrap">
        <GhostBtn onClick={onBack} disabled={loading}>Back</GhostBtn>
        <PrimaryBtn onClick={handleSubmit} disabled={!canSubmit} loading={loading}>
          Submit sighting
        </PrimaryBtn>
      </div>

      <p className="mt-4 text-sm" style={{ color: "var(--color-ink-2)", fontSize: 12 }}>
        Sightings appear under the ScubaSeason observer account on conservation platforms.
      </p>
    </div>
  );
}

function ConfirmThumb({ file }: { file: File }) {
  const [url, setUrl] = useState<string | null>(null);
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const u = URL.createObjectURL(file);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [file]);
  /* eslint-enable react-hooks/set-state-in-effect */
  if (!url) return null;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} alt="" className="w-16 h-16 object-cover rounded" />;
}

// ─── Step 4: Broadcast confirmation ──────────────────────────────────────────

function BroadcastConfirmation({
  submitResponse,
  formData,
  onAnother,
}: {
  submitResponse: SubmitResponse;
  formData: FormData;
  onAnother: () => void;
}) {
  const hasSeahorse = formData.species.some((s) => s.isSeahorse);
  const coralWatchEligible =
    formData.category === "coral" &&
    formData.depthM !== "" &&
    formData.bleachingScore !== null;

  type PlatformRow = { name: string; delay: number };
  const allPlatformRows: PlatformRow[] = [
    { name: "iNaturalist", delay: 0 },
    { name: "GBIF", delay: 400 },
    { name: "OBIS", delay: 800 },
    ...(hasSeahorse ? [{ name: "iSeahorse", delay: 1200 }] : []),
    ...(coralWatchEligible ? [{ name: "CoralWatch", delay: 1600 }] : []),
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
          fontSize: "1.875rem",
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
            className="flex items-center gap-2 text-sm transition-opacity"
            style={{
              opacity: i < visibleCount ? 1 : 0,
              fontFamily: "var(--font-sans)",
            }}
          >
            <span style={{ color: "var(--color-improving)", fontWeight: 600 }}>✓</span>
            <span style={{ color: "var(--color-ink)" }}>{row.name}</span>
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

// ─── Main wizard (inner — reads search params) ────────────────────────────────

function UploadWizardInner() {
  const searchParams = useSearchParams();
  const prefilledSlug = searchParams.get("site");

  const headingRef = useRef<HTMLElement | null>(null);
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
    };
  });

  // Auto-advance to step 2 if site was pre-filled from URL
  useEffect(() => {
    if (prefilledSlug && formData.site) {
      setStep(2);
    }
    // Only on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const goToStep = (s: WizardStep) => {
    setStep(s);
    // Focus heading for a11y — find next render
    setTimeout(() => {
      const el = document.getElementById("step-heading");
      if (el) el.focus();
    }, 50);
  };

  const handleAnother = () => {
    // Keep site context from previous submission
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
    }));
    setSubmitResponse(null);
    setStep(1);
  };

  return (
    <div ref={headingRef as React.RefObject<HTMLDivElement>}>
      {step < 4 && <StepIndicator currentStep={step} />}

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
          onNext={() => goToStep(3)}
        />
      )}

      {step === 3 && (
        <Step3Submit
          formData={formData}
          onBack={() => goToStep(2)}
          onSuccess={(res) => {
            setSubmitResponse(res);
            goToStep(4);
          }}
        />
      )}

      {step === 4 && submitResponse && (
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

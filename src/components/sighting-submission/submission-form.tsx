"use client";

import { useState, useRef, useCallback, useEffect } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Category = "fish" | "coral" | "other";
type BleachingScore = "healthy" | "pale" | "bleached" | "dead";
type Step = 1 | 2 | 3 | 4 | 5;

export type SiteOption = {
  id: string;
  name: string;
  lat: number;
  lng: number;
};

type TaxonSuggestion = {
  taxonId: number;
  scientificName: string;
  commonName: string | null;
  isSeahorse: boolean;
};

type SubmitResult = {
  ok: boolean;
  queued?: boolean;
  observationUrl?: string;
  submittedTo?: string[];
  error?: string;
};

// ─── Props ────────────────────────────────────────────────────────────────────

// Site page: site is pre-filled and locked
type SiteProps = {
  mode: "site";
  siteId: string;
  siteName: string;
  siteLat: number;
  siteLng: number;
};

// Location page: user picks (or GPS auto-detects) from a list of sites
type LocationProps = {
  mode: "location";
  locationId: string;
  locationName: string;
  locationSites: SiteOption[];
};

type Props = SiteProps | LocationProps;

// ─── Constants ────────────────────────────────────────────────────────────────

const MAX_PHOTOS = 10;
const ACCEPTED_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_FILE_BYTES = 20 * 1024 * 1024;

const BLEACHING_OPTIONS: { value: BleachingScore; label: string; color: string }[] = [
  { value: "healthy", label: "Healthy", color: "#15824c" },
  { value: "pale", label: "Pale", color: "#b9751a" },
  { value: "bleached", label: "Bleached", color: "#c0392f" },
  { value: "dead", label: "Dead", color: "#6b7280" },
];

// ─── Styles ───────────────────────────────────────────────────────────────────

const S = {
  label: {
    fontSize: "0.6875rem",
    fontWeight: 700 as const,
    letterSpacing: "0.14em",
    textTransform: "uppercase" as const,
    color: "#8b9db8",
    display: "block",
    marginBottom: "0.5rem",
  } satisfies React.CSSProperties,
  input: {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(0,212,255,0.18)",
    borderRadius: "0.5rem",
    color: "#f0f4f8",
    fontSize: "0.9rem",
    padding: "0.55rem 0.75rem",
    width: "100%",
    boxSizing: "border-box" as const,
    outline: "none",
  } satisfies React.CSSProperties,
  primaryBtn: {
    background: "#00d4ff",
    color: "#0a1628",
    border: "none",
    borderRadius: "0.625rem",
    padding: "0.65rem 1.25rem",
    fontWeight: 700 as const,
    fontSize: "0.9rem",
    cursor: "pointer",
  } satisfies React.CSSProperties,
  ghostBtn: {
    background: "none",
    border: "1px solid rgba(0,212,255,0.25)",
    borderRadius: "0.625rem",
    color: "#00d4ff",
    fontSize: "0.875rem",
    fontWeight: 600 as const,
    padding: "0.6rem 1rem",
    cursor: "pointer",
  } satisfies React.CSSProperties,
  error: {
    fontSize: "0.8125rem",
    color: "#f87171",
    marginTop: "0.4rem",
  } satisfies React.CSSProperties,
};

// ─── EXIF helpers ──────────────────────────────────────────────────────────────

type ExifData = { date: string | null; lat: number | null; lng: number | null };

async function readExif(file: File): Promise<ExifData> {
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

              let date: string | null = null;
              let gpsPtr: number | null = null;

              for (let i = 0; i < nEntries; i++) {
                const e0 = ifd0 + 2 + i * 12;
                const tag = tv.getUint16(e0, le);
                if (tag === 0x9003 || tag === 0x0132) {
                  const vOff = tv.getUint32(e0 + 8, le);
                  const ds = new TextDecoder().decode(new Uint8Array(buf, tiffStart + vOff, 10));
                  const iso = ds.replace(/^(\d{4}):(\d{2}):(\d{2})$/, "$1-$2-$3");
                  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) date = iso;
                }
                if (tag === 0x8825) gpsPtr = tv.getUint32(e0 + 8, le);
              }

              let lat: number | null = null;
              let lng: number | null = null;

              if (gpsPtr !== null) {
                const gn = tv.getUint16(gpsPtr, le);
                let latRef: string | null = null;
                let lngRef: string | null = null;
                let latDMS: [number, number, number] | null = null;
                let lngDMS: [number, number, number] | null = null;

                for (let i = 0; i < gn; i++) {
                  const e0 = gpsPtr + 2 + i * 12;
                  const tag = tv.getUint16(e0, le);
                  if (tag === 0x0001) latRef = String.fromCharCode(tv.getUint8(e0 + 8));
                  if (tag === 0x0003) lngRef = String.fromCharCode(tv.getUint8(e0 + 8));
                  if (tag === 0x0002 || tag === 0x0004) {
                    const vOff = tv.getUint32(e0 + 8, le);
                    const dms: [number, number, number] = [0, 0, 0];
                    for (let j = 0; j < 3; j++) {
                      const num = tv.getUint32(tiffStart + vOff + j * 8, le);
                      const den = tv.getUint32(tiffStart + vOff + j * 8 + 4, le);
                      dms[j] = den !== 0 ? num / den : 0;
                    }
                    if (tag === 0x0002) latDMS = dms;
                    else lngDMS = dms;
                  }
                }

                if (latDMS && lngDMS) {
                  lat = latDMS[0] + latDMS[1] / 60 + latDMS[2] / 3600;
                  lng = lngDMS[0] + lngDMS[1] / 60 + lngDMS[2] / 3600;
                  if (latRef === "S") lat = -lat;
                  if (lngRef === "W") lng = -lng;
                }
              }

              resolve({ date, lat, lng });
              return;
            }
          }
          if (length < 2) break;
          offset += 2 + length;
        }
      } catch {
        // ignore parse errors
      }
      resolve({ date: null, lat: null, lng: null });
    };
    reader.readAsArrayBuffer(file.slice(0, 131072));
  });
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

function findNearestSite(lat: number, lng: number, sites: SiteOption[]): SiteOption | null {
  let nearest: SiteOption | null = null;
  let minKm = Infinity;
  for (const s of sites) {
    const km = haversineKm(lat, lng, s.lat, s.lng);
    if (km < minKm) { minKm = km; nearest = s; }
  }
  return minKm <= 5 ? nearest : null;
}

function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// ─── Info modal ────────────────────────────────────────────────────────────────

function InfoModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="How your sighting helps"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
        background: "rgba(10,22,40,0.85)",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          background: "#0d1f35",
          border: "1px solid rgba(0,212,255,0.2)",
          borderRadius: "1.25rem",
          padding: "1.75rem",
          maxWidth: 480,
          width: "100%",
          maxHeight: "85vh",
          overflowY: "auto",
          position: "relative",
        }}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          style={{ position: "absolute", top: "1rem", right: "1rem", background: "none", border: "none", color: "#8b9db8", fontSize: "1.25rem", cursor: "pointer", lineHeight: 1 }}
        >×</button>

        <h3 style={{ fontSize: "1rem", fontWeight: 800, color: "#f0f4f8", marginBottom: "0.85rem", letterSpacing: "-0.02em" }}>
          Where your photo goes
        </h3>

        <p style={{ fontSize: "0.875rem", color: "#aebcd0", lineHeight: 1.65, marginBottom: "1.1rem" }}>
          One upload from you reaches 5 conservation databases automatically — no accounts needed.
        </p>

        {[
          { name: "iNaturalist", note: "World's largest biodiversity platform. Community experts help ID unknown species." },
          { name: "GBIF", note: "Global Biodiversity Information Facility — used by researchers in 100+ countries. Flows in automatically from iNaturalist." },
          { name: "OBIS", note: "Ocean Biodiversity Information System — the global marine species repository, used by IUCN and UN Environment." },
          { name: "iSeahorse", note: "Project Seahorse's global database. Only triggered if your photo is a seahorse." },
          { name: "CoralWatch", note: "University of Queensland's coral bleaching monitor, 79 countries. Only triggered if you photograph coral and record depth and bleaching score." },
        ].map((p) => (
          <div key={p.name} style={{ marginBottom: "0.85rem" }}>
            <p style={{ fontSize: "0.875rem", fontWeight: 700, color: "#f0f4f8", marginBottom: "0.15rem" }}>{p.name}</p>
            <p style={{ fontSize: "0.8rem", color: "#aebcd0", lineHeight: 1.6, margin: 0 }}>{p.note}</p>
          </div>
        ))}

        <p style={{ fontSize: "0.75rem", color: "#8b9db8", marginTop: "1rem", borderTop: "1px solid rgba(0,212,255,0.1)", paddingTop: "0.85rem" }}>
          Sightings appear under the ScubaSeason observer account on conservation platforms.
        </p>

        <button type="button" onClick={onClose} style={{ ...S.primaryBtn, marginTop: "1rem", fontSize: "0.875rem" }}>Got it</button>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function SubmissionForm(props: Props) {
  const [step, setStep] = useState<Step>(1);
  const [infoOpen, setInfoOpen] = useState(false);

  // Resolved site (set from page context or user selection)
  const [selectedSite, setSelectedSite] = useState<SiteOption | null>(
    props.mode === "site" ? { id: props.siteId, name: props.siteName, lat: props.siteLat, lng: props.siteLng } : null
  );
  const [gpsDetected, setGpsDetected] = useState(false);
  const [showSiteSelector, setShowSiteSelector] = useState(false);

  // Step 1 — photos
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Step 2 — category + species
  const [category, setCategory] = useState<Category | null>(null);
  const [speciesText, setSpeciesText] = useState("");
  const [taxonId, setTaxonId] = useState<number | null>(null);
  const [taxonDisplayName, setTaxonDisplayName] = useState<string | null>(null);
  const [isSeahorse, setIsSeahorse] = useState(false);
  const [needsReview, setNeedsReview] = useState(false);
  const [suggestions, setSuggestions] = useState<TaxonSuggestion[]>([]);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Step 3 — details
  const [observedOn, setObservedOn] = useState(todayIso());
  const [depthM, setDepthM] = useState("");
  const [tempC, setTempC] = useState("");
  const [bleachingScore, setBleachingScore] = useState<BleachingScore | null>(null);
  const [notes, setNotes] = useState("");

  // Submit
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<SubmitResult | null>(null);

  const contextName =
    props.mode === "site" ? props.siteName : props.locationName;

  // ── Photo handling ──────────────────────────────────────────────────────────

  const addFiles = useCallback(
    async (files: FileList | null) => {
      if (!files) return;
      setPhotoError(null);
      const incoming = Array.from(files);

      for (const f of incoming) {
        const ext = f.name.split(".").pop()?.toLowerCase() ?? "";
        if (!ACCEPTED_MIME.has(f.type)) {
          if (["heic", "heif"].includes(ext)) {
            setPhotoError("HEIC files are not yet supported. Please export as JPEG first.");
          } else {
            setPhotoError(`${f.name}: unsupported format. Please use JPEG or PNG.`);
          }
          return;
        }
        if (f.size > MAX_FILE_BYTES) {
          setPhotoError(`${f.name} is over 20 MB. Please reduce the file size.`);
          return;
        }
      }

      setPhotos((prev) => [...prev, ...incoming].slice(0, MAX_PHOTOS));

      // Read EXIF from first photo
      if (incoming.length > 0) {
        const exif = await readExif(incoming[0]);
        if (exif.date) setObservedOn(exif.date);

        // GPS auto-detect (location mode only)
        if (
          props.mode === "location" &&
          exif.lat !== null &&
          exif.lng !== null
        ) {
          const match = findNearestSite(exif.lat, exif.lng, props.locationSites);
          if (match) {
            setSelectedSite(match);
            setGpsDetected(true);
          }
        }
      }
    },
    [props]
  );

  const removePhoto = (index: number) => setPhotos((prev) => prev.filter((_, i) => i !== index));

  // ── Species autocomplete ────────────────────────────────────────────────────

  const fetchSuggestions = useCallback((q: string) => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (q.length < 2) { setSuggestions([]); setSuggestionsOpen(false); return; }
    searchTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/taxa/search?q=${encodeURIComponent(q)}`);
        const data = (await res.json()) as { taxa: TaxonSuggestion[] };
        setSuggestions(data.taxa ?? []);
        setSuggestionsOpen(data.taxa.length > 0);
      } catch { setSuggestions([]); }
    }, 320);
  }, []);

  const handleSpeciesInput = (value: string) => {
    setSpeciesText(value);
    setTaxonId(null); setTaxonDisplayName(null); setIsSeahorse(false); setNeedsReview(false);
    fetchSuggestions(value);
  };

  const selectTaxon = (t: TaxonSuggestion) => {
    const display = t.commonName ? `${t.commonName} (${t.scientificName})` : t.scientificName;
    setSpeciesText(display); setTaxonId(t.taxonId); setTaxonDisplayName(display);
    setIsSeahorse(t.isSeahorse); setNeedsReview(false);
    setSuggestionsOpen(false); setSuggestions([]);
  };

  const commitFreeText = () => {
    if (speciesText.trim() && !taxonId) { setNeedsReview(true); setTaxonDisplayName(speciesText.trim()); }
    setSuggestionsOpen(false);
  };

  useEffect(() => {
    const handler = () => setSuggestionsOpen(false);
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);

  const coralWatchEligible = category === "coral" && depthM !== "" && bleachingScore !== null;

  // ── Submit ──────────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (!selectedSite) return;
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("siteId", selectedSite.id);
      fd.append("siteName", selectedSite.name);
      fd.append("siteLat", String(selectedSite.lat));
      fd.append("siteLng", String(selectedSite.lng));
      fd.append("category", category!);
      if (taxonId) fd.append("taxonId", String(taxonId));
      if (speciesText.trim()) fd.append("taxonName", speciesText.trim());
      if (taxonDisplayName) fd.append("speciesDisplay", taxonDisplayName);
      fd.append("isSeahorse", String(isSeahorse));
      fd.append("observedOn", observedOn);
      if (depthM) fd.append("depthM", depthM);
      if (tempC) fd.append("tempC", tempC);
      if (bleachingScore) fd.append("bleachingScore", bleachingScore);
      if (notes.trim()) fd.append("notes", notes.trim());
      fd.append("needsReview", String(needsReview));
      for (const p of photos) fd.append("photos", p);

      const res = await fetch("/api/submit-sighting", { method: "POST", body: fd });
      const data = (await res.json()) as SubmitResult & { error?: string };
      if (!res.ok) setSubmitResult({ ok: false, error: data.error ?? "Submission failed." });
      else { setSubmitResult(data); setStep(5); }
    } catch {
      setSubmitResult({ ok: false, error: "Network error. Please check your connection." });
    } finally {
      setSubmitting(false); }
  };

  const resetForm = () => {
    setStep(1); setPhotos([]); setPhotoError(null); setCategory(null);
    setSpeciesText(""); setTaxonId(null); setTaxonDisplayName(null);
    setIsSeahorse(false); setNeedsReview(false); setObservedOn(todayIso());
    setDepthM(""); setTempC(""); setBleachingScore(null); setNotes("");
    setSubmitResult(null); setSubmitting(false); setGpsDetected(false);
    if (props.mode === "location") setSelectedSite(null);
  };

  const STEPS = ["Photos", "Sighting", "Details", "Confirm"];
  const activeStep = Math.min(step, 4);

  return (
    <>
      <section
        id="sighting-submission"
        style={{
          border: "1px solid rgba(0,212,255,0.18)",
          background: "rgba(0,212,255,0.05)",
          borderRadius: "1.25rem",
          padding: "1.5rem 1.6rem",
        }}
      >
        {/* Compact header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.1rem" }}>
          <div>
            <h3 style={{ fontSize: "1.05rem", fontWeight: 800, color: "#f0f4f8", marginBottom: "0.2rem", letterSpacing: "-0.02em" }}>
              Dived {props.mode === "site" ? `${contextName}` : "here"} recently?
            </h3>
            <p style={{ fontSize: "0.8125rem", color: "#8b9db8", lineHeight: 1.5 }}>
              Your photos help track reef health.{" "}
              <button
                type="button"
                onClick={() => setInfoOpen(true)}
                style={{ background: "none", border: "none", color: "#00d4ff", cursor: "pointer", fontSize: "0.8125rem", fontWeight: 600, padding: 0 }}
              >
                How? →
              </button>
            </p>
          </div>
        </div>

        {step < 5 && (
          <div style={{ display: "flex", gap: "0.25rem", marginBottom: "1.5rem" }}>
            {STEPS.map((label, i) => {
              const n = i + 1;
              return (
                <div key={label} style={{ flex: 1, textAlign: "center" }}>
                  <div style={{ height: 3, borderRadius: 2, background: n <= activeStep ? "#00d4ff" : "rgba(0,212,255,0.15)", marginBottom: "0.3rem" }} />
                  <span style={{ fontSize: "0.65rem", fontWeight: 600, color: n === activeStep ? "#00d4ff" : n < activeStep ? "#aebcd0" : "#8b9db8", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                    {label}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {step === 1 && (
          <StepPhotos
            photos={photos}
            photoError={photoError}
            fileInputRef={fileInputRef}
            onAddFiles={addFiles}
            onRemove={removePhoto}
            // Site context section
            mode={props.mode}
            locationSites={props.mode === "location" ? props.locationSites : undefined}
            selectedSite={selectedSite}
            gpsDetected={gpsDetected}
            showSiteSelector={showSiteSelector}
            onShowSiteSelector={() => setShowSiteSelector(true)}
            onSelectSite={(s) => { setSelectedSite(s); setGpsDetected(false); setShowSiteSelector(false); }}
            onNext={() => {
              if (photos.length === 0) { setPhotoError("Please add at least one photo."); return; }
              if (props.mode === "location" && !selectedSite) { setPhotoError("Please select a dive site."); return; }
              setPhotoError(null);
              setStep(2);
            }}
          />
        )}

        {step === 2 && (
          <StepSighting
            category={category}
            speciesText={speciesText}
            taxonId={taxonId}
            isSeahorse={isSeahorse}
            suggestions={suggestions}
            suggestionsOpen={suggestionsOpen}
            onCategoryChange={(c) => { setCategory(c); if (c !== "coral") setBleachingScore(null); }}
            onSpeciesInput={handleSpeciesInput}
            onSelectTaxon={selectTaxon}
            onCommitFreeText={commitFreeText}
            onBack={() => setStep(1)}
            onNext={() => {
              if (!category) return;
              setSuggestionsOpen(false);
              if (speciesText.trim() && !taxonId) setNeedsReview(true);
              setStep(3);
            }}
          />
        )}

        {step === 3 && (
          <StepDetails
            category={category!}
            observedOn={observedOn}
            depthM={depthM}
            tempC={tempC}
            bleachingScore={bleachingScore}
            notes={notes}
            onObservedOnChange={setObservedOn}
            onDepthChange={setDepthM}
            onTempChange={setTempC}
            onBleachingChange={setBleachingScore}
            onNotesChange={setNotes}
            coralWatchEligible={coralWatchEligible}
            onBack={() => setStep(2)}
            onNext={() => setStep(4)}
          />
        )}

        {step === 4 && selectedSite && (
          <StepConfirm
            siteName={selectedSite.name}
            photos={photos}
            category={category!}
            speciesDisplay={taxonDisplayName ?? (speciesText.trim() || null)}
            observedOn={observedOn}
            depthM={depthM}
            isSeahorse={isSeahorse}
            coralWatchEligible={coralWatchEligible}
            submitting={submitting}
            submitError={submitResult?.error ?? null}
            onBack={() => setStep(3)}
            onSubmit={handleSubmit}
          />
        )}

        {step === 5 && submitResult && (
          <StepSuccess
            siteName={selectedSite?.name ?? contextName}
            observationUrl={submitResult.observationUrl}
            submittedTo={submitResult.submittedTo}
            onAnother={resetForm}
          />
        )}
      </section>

      {infoOpen && <InfoModal onClose={() => setInfoOpen(false)} />}
    </>
  );
}

// ─── Step 1: Photos + site context ────────────────────────────────────────────

function StepPhotos({
  photos, photoError, fileInputRef, onAddFiles, onRemove,
  mode, locationSites, selectedSite, gpsDetected, showSiteSelector,
  onShowSiteSelector, onSelectSite, onNext,
}: {
  photos: File[];
  photoError: string | null;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onAddFiles: (files: FileList | null) => void;
  onRemove: (i: number) => void;
  mode: "site" | "location";
  locationSites?: SiteOption[];
  selectedSite: SiteOption | null;
  gpsDetected: boolean;
  showSiteSelector: boolean;
  onShowSiteSelector: () => void;
  onSelectSite: (s: SiteOption) => void;
  onNext: () => void;
}) {
  const [dragging, setDragging] = useState(false);

  return (
    <div>
      <p style={{ fontSize: "0.8rem", color: "#8b9db8", marginBottom: "0.85rem" }}>
        Up to {MAX_PHOTOS} photos · JPEG or PNG · max 20 MB each
      </p>

      <div
        role="button"
        tabIndex={0}
        aria-label="Upload photos"
        onClick={() => fileInputRef.current?.click()}
        onKeyDown={(e) => e.key === "Enter" && fileInputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); onAddFiles(e.dataTransfer.files); }}
        style={{
          border: `2px dashed ${dragging ? "#00d4ff" : "rgba(0,212,255,0.3)"}`,
          borderRadius: "0.875rem",
          padding: "1.75rem",
          textAlign: "center",
          cursor: "pointer",
          background: dragging ? "rgba(0,212,255,0.07)" : "transparent",
          transition: "border-color 0.15s, background 0.15s",
          marginBottom: "0.75rem",
        }}
      >
        <p style={{ fontSize: "1.4rem", marginBottom: "0.4rem" }}>📷</p>
        <p style={{ fontSize: "0.875rem", color: "#aebcd0" }}>
          Drag photos here, or{" "}
          <span style={{ color: "#00d4ff", fontWeight: 600 }}>tap to select</span>
        </p>
        <p style={{ fontSize: "0.75rem", color: "#8b9db8", marginTop: "0.25rem" }}>
          GPS in your photo will auto-detect the dive site
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
          multiple
          style={{ display: "none" }}
          onChange={(e) => onAddFiles(e.target.files)}
        />
      </div>

      {photos.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(72px, 1fr))", gap: "0.5rem", marginBottom: "0.75rem" }}>
          {photos.map((file, i) => <PhotoThumb key={`${file.name}-${i}`} file={file} onRemove={() => onRemove(i)} />)}
        </div>
      )}

      {/* Site context — location mode only */}
      {mode === "location" && (
        <div style={{ marginBottom: "0.85rem", padding: "0.75rem 1rem", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(0,212,255,0.12)", borderRadius: "0.75rem" }}>
          <p style={{ fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#8b9db8", marginBottom: "0.4rem" }}>
            Dive site
          </p>

          {selectedSite && !showSiteSelector ? (
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", justifyContent: "space-between" }}>
              <span style={{ fontSize: "0.9rem", fontWeight: 700, color: "#f0f4f8" }}>
                {gpsDetected && <span style={{ fontSize: "0.7rem", color: "#00d4ff", marginRight: "0.4rem" }}>📍 GPS matched</span>}
                {selectedSite.name}
              </span>
              <button type="button" onClick={onShowSiteSelector} style={{ background: "none", border: "none", color: "#00d4ff", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer", padding: 0, flexShrink: 0 }}>
                Change
              </button>
            </div>
          ) : (
            <select
              value={selectedSite?.id ?? ""}
              onChange={(e) => {
                const site = locationSites?.find((s) => s.id === e.target.value);
                if (site) onSelectSite(site);
              }}
              style={{ ...S.input, background: "rgba(10,22,40,0.8)", colorScheme: "dark" }}
            >
              <option value="">Select a dive site…</option>
              {locationSites?.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          )}
        </div>
      )}

      {photoError && <p style={S.error}>{photoError}</p>}

      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
        {photos.length > 0 && photos.length < MAX_PHOTOS && (
          <button type="button" style={S.ghostBtn} onClick={() => fileInputRef.current?.click()}>Add more</button>
        )}
        <button type="button" style={S.primaryBtn} onClick={onNext}>
          Next: What did you see? →
        </button>
      </div>
    </div>
  );
}

function PhotoThumb({ file, onRemove }: { file: File; onRemove: () => void }) {
  const [url, setUrl] = useState<string | null>(null);
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const u = URL.createObjectURL(file);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [file]);
  /* eslint-enable react-hooks/set-state-in-effect */
  return (
    <div style={{ position: "relative" }}>
      {url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="" style={{ width: "100%", aspectRatio: "1", objectFit: "cover", borderRadius: "0.5rem", display: "block" }} />
      )}
      <button type="button" aria-label="Remove photo" onClick={onRemove}
        style={{ position: "absolute", top: 2, right: 2, background: "rgba(10,22,40,0.8)", border: "none", borderRadius: "50%", width: 20, height: 20, color: "#f0f4f8", fontSize: "0.75rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1 }}>
        ×
      </button>
    </div>
  );
}

// ─── Step 2: Sighting ─────────────────────────────────────────────────────────

function StepSighting({
  category, speciesText, taxonId, isSeahorse, suggestions, suggestionsOpen,
  onCategoryChange, onSpeciesInput, onSelectTaxon, onCommitFreeText, onBack, onNext,
}: {
  category: Category | null;
  speciesText: string;
  taxonId: number | null;
  isSeahorse: boolean;
  suggestions: TaxonSuggestion[];
  suggestionsOpen: boolean;
  onCategoryChange: (c: Category) => void;
  onSpeciesInput: (v: string) => void;
  onSelectTaxon: (t: TaxonSuggestion) => void;
  onCommitFreeText: () => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const cats: { value: Category; label: string; icon: string; desc: string }[] = [
    { value: "fish", label: "Fish or marine life", icon: "🐠", desc: "Any sea creature" },
    { value: "coral", label: "Coral", icon: "🪸", desc: "Healthy or bleached" },
    { value: "other", label: "Something else", icon: "🔍", desc: "Debris, unusual behaviour, etc." },
  ];

  return (
    <div>
      <p style={{ fontSize: "0.875rem", color: "#8b9db8", marginBottom: "1rem" }}>What did you photograph?</p>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "1.25rem" }}>
        {cats.map((c) => (
          <button key={c.value} type="button" onClick={() => onCategoryChange(c.value)}
            style={{ display: "flex", alignItems: "center", gap: "0.85rem", padding: "0.9rem 1rem", border: `1px solid ${category === c.value ? "#00d4ff" : "rgba(0,212,255,0.2)"}`, borderRadius: "0.75rem", background: category === c.value ? "rgba(0,212,255,0.1)" : "rgba(255,255,255,0.02)", cursor: "pointer", textAlign: "left", width: "100%" }}>
            <span style={{ fontSize: "1.4rem", flexShrink: 0 }}>{c.icon}</span>
            <span>
              <span style={{ display: "block", fontSize: "0.875rem", fontWeight: 700, color: "#f0f4f8" }}>{c.label}</span>
              <span style={{ display: "block", fontSize: "0.8rem", color: "#8b9db8" }}>{c.desc}</span>
            </span>
            {category === c.value && <span style={{ marginLeft: "auto", color: "#00d4ff" }}>✓</span>}
          </button>
        ))}
      </div>

      <div style={{ marginBottom: "1.25rem", position: "relative" }}>
        <label style={S.label} htmlFor="species-input">
          Species <span style={{ fontWeight: 400, color: "#8b9db8" }}>(optional)</span>
        </label>
        <div style={{ position: "relative" }}>
          <input
            id="species-input"
            type="text"
            value={speciesText}
            onChange={(e) => onSpeciesInput(e.target.value)}
            onBlur={onCommitFreeText}
            placeholder="Start typing — we will match to the database"
            style={S.input}
            autoComplete="off"
          />
          {isSeahorse && (
            <span style={{ position: "absolute", right: "0.6rem", top: "50%", transform: "translateY(-50%)", fontSize: "0.7rem", background: "rgba(0,212,255,0.15)", color: "#00d4ff", borderRadius: "0.3rem", padding: "0.15rem 0.4rem", fontWeight: 700 }}>
              + iSeahorse
            </span>
          )}
        </div>

        {suggestionsOpen && suggestions.length > 0 && (
          <ul style={{ position: "absolute", top: "100%", left: 0, right: 0, zIndex: 100, background: "#0d1f35", border: "1px solid rgba(0,212,255,0.2)", borderRadius: "0.5rem", margin: 0, padding: 0, listStyle: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.5)" }}>
            {suggestions.map((t) => (
              <li key={t.taxonId}>
                <button type="button" onMouseDown={() => onSelectTaxon(t)}
                  style={{ display: "block", width: "100%", textAlign: "left", padding: "0.6rem 0.85rem", background: "none", border: "none", cursor: "pointer", color: "#f0f4f8" }}>
                  <span style={{ display: "block", fontSize: "0.875rem", fontWeight: 600 }}>{t.commonName ?? t.scientificName}</span>
                  {t.commonName && <span style={{ display: "block", fontSize: "0.75rem", color: "#8b9db8", fontStyle: "italic" }}>{t.scientificName}</span>}
                  {t.isSeahorse && <span style={{ fontSize: "0.7rem", color: "#00d4ff" }}>→ iSeahorse</span>}
                </button>
              </li>
            ))}
          </ul>
        )}

        {taxonId && <p style={{ fontSize: "0.75rem", color: "#15824c", marginTop: "0.3rem" }}>✓ Matched — submits directly to iNaturalist</p>}
        <p style={{ fontSize: "0.75rem", color: "#8b9db8", marginTop: "0.3rem" }}>Leave blank if unsure — iNaturalist&apos;s community will identify from your photo.</p>
      </div>

      <div style={{ display: "flex", gap: "0.75rem" }}>
        <button type="button" style={S.ghostBtn} onClick={onBack}>← Back</button>
        <button type="button" style={{ ...S.primaryBtn, opacity: category ? 1 : 0.5 }} onClick={onNext} disabled={!category}>
          Next: Details →
        </button>
      </div>
    </div>
  );
}

// ─── Step 3: Details ──────────────────────────────────────────────────────────

function StepDetails({
  category, observedOn, depthM, tempC, bleachingScore, notes,
  onObservedOnChange, onDepthChange, onTempChange, onBleachingChange, onNotesChange,
  coralWatchEligible, onBack, onNext,
}: {
  category: Category;
  observedOn: string;
  depthM: string;
  tempC: string;
  bleachingScore: BleachingScore | null;
  notes: string;
  onObservedOnChange: (v: string) => void;
  onDepthChange: (v: string) => void;
  onTempChange: (v: string) => void;
  onBleachingChange: (v: BleachingScore) => void;
  onNotesChange: (v: string) => void;
  coralWatchEligible: boolean;
  onBack: () => void;
  onNext: () => void;
}) {
  return (
    <div>
      <div style={{ display: "flex", flexDirection: "column", gap: "1.1rem", marginBottom: "1.25rem" }}>
        <div>
          <label style={S.label} htmlFor="observed-on">Date of dive</label>
          <input id="observed-on" type="date" value={observedOn} onChange={(e) => onObservedOnChange(e.target.value)} style={{ ...S.input, colorScheme: "dark" }} />
        </div>
        <div>
          <label style={S.label} htmlFor="depth-m">
            Depth (metres){category === "coral" && <span style={{ color: "#b9751a", fontWeight: 600 }}> — needed for CoralWatch</span>}
          </label>
          <input id="depth-m" type="number" min="0" max="200" step="0.5" value={depthM} onChange={(e) => onDepthChange(e.target.value)} placeholder="e.g. 12" style={S.input} />
        </div>
        <div>
          <label style={S.label} htmlFor="temp-c">Sea temperature (°C) <span style={{ fontWeight: 400 }}>(optional)</span></label>
          <input id="temp-c" type="number" min="0" max="40" step="0.5" value={tempC} onChange={(e) => onTempChange(e.target.value)} placeholder="e.g. 27" style={S.input} />
        </div>
        {category === "coral" && (
          <div>
            <p style={S.label}>
              Bleaching score<span style={{ color: "#b9751a", fontWeight: 600 }}> — needed for CoralWatch</span>
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
              {BLEACHING_OPTIONS.map((opt) => (
                <button key={opt.value} type="button" onClick={() => onBleachingChange(opt.value)}
                  style={{ padding: "0.45rem 0.9rem", borderRadius: "0.5rem", border: `1px solid ${bleachingScore === opt.value ? opt.color : "rgba(255,255,255,0.15)"}`, background: bleachingScore === opt.value ? `${opt.color}22` : "transparent", color: bleachingScore === opt.value ? opt.color : "#aebcd0", fontWeight: 600, fontSize: "0.8rem", cursor: "pointer" }}>
                  {opt.label}
                </button>
              ))}
            </div>
            {coralWatchEligible
              ? <p style={{ fontSize: "0.75rem", color: "#15824c", marginTop: "0.4rem" }}>✓ Will also queue for CoralWatch (weekly batch)</p>
              : <p style={{ fontSize: "0.75rem", color: "#8b9db8", marginTop: "0.4rem" }}>Fill depth + bleaching score to also submit to CoralWatch.</p>}
          </div>
        )}
        <div>
          <label style={S.label} htmlFor="notes">Notes <span style={{ fontWeight: 400 }}>(optional, max 280 chars)</span></label>
          <textarea id="notes" value={notes} onChange={(e) => onNotesChange(e.target.value)} maxLength={280}
            placeholder="Behaviour, location within site, anything unusual…"
            rows={3} style={{ ...S.input, resize: "vertical", fontFamily: "inherit" }} />
          <p style={{ fontSize: "0.7rem", color: "#8b9db8", textAlign: "right", marginTop: "0.2rem" }}>{notes.length} / 280</p>
        </div>
      </div>
      <div style={{ display: "flex", gap: "0.75rem" }}>
        <button type="button" style={S.ghostBtn} onClick={onBack}>← Back</button>
        <button type="button" style={S.primaryBtn} onClick={onNext}>Review and submit →</button>
      </div>
    </div>
  );
}

// ─── Step 4: Confirm ──────────────────────────────────────────────────────────

function StepConfirm({
  siteName, photos, category, speciesDisplay, observedOn, depthM,
  isSeahorse, coralWatchEligible, submitting, submitError, onBack, onSubmit,
}: {
  siteName: string;
  photos: File[];
  category: Category;
  speciesDisplay: string | null;
  observedOn: string;
  depthM: string;
  isSeahorse: boolean;
  coralWatchEligible: boolean;
  submitting: boolean;
  submitError: string | null;
  onBack: () => void;
  onSubmit: () => void;
}) {
  const platforms = [
    "iNaturalist",
    "GBIF (via iNaturalist)",
    "OBIS (via iNaturalist)",
    ...(isSeahorse ? ["iSeahorse"] : []),
    ...(coralWatchEligible ? ["CoralWatch (weekly batch)"] : []),
  ];

  return (
    <div>
      <h4 style={{ fontSize: "0.875rem", fontWeight: 700, color: "#f0f4f8", marginBottom: "0.85rem" }}>
        Your sighting at {siteName}
      </h4>

      <div style={{ display: "flex", gap: "0.4rem", marginBottom: "1rem", flexWrap: "wrap" }}>
        {photos.slice(0, 5).map((f, i) => <ConfirmThumb key={i} file={f} />)}
        {photos.length > 5 && (
          <div style={{ width: 56, height: 56, borderRadius: "0.4rem", background: "rgba(0,212,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", color: "#00d4ff", fontWeight: 700 }}>
            +{photos.length - 5}
          </div>
        )}
      </div>

      <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "0.75rem", padding: "0.85rem 1rem", marginBottom: "1rem", fontSize: "0.875rem", color: "#aebcd0", lineHeight: 1.8 }}>
        <span style={{ color: "#f0f4f8", fontWeight: 600, textTransform: "capitalize" }}>{category}</span>
        {speciesDisplay && <span> · {speciesDisplay}</span>}
        {depthM && <span> · {depthM}m depth</span>}
        <span> · {observedOn}</span>
      </div>

      <div style={{ marginBottom: "1.25rem" }}>
        <p style={{ fontSize: "0.75rem", fontWeight: 700, color: "#8b9db8", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.5rem" }}>Submitting to</p>
        <ul style={{ margin: 0, padding: 0, listStyle: "none", fontSize: "0.875rem", color: "#aebcd0" }}>
          {platforms.map((p) => <li key={p} style={{ paddingBottom: "0.2rem" }}>— {p}</li>)}
        </ul>
      </div>

      {submitError && <p style={{ ...S.error, marginBottom: "0.85rem" }}>{submitError}</p>}

      <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
        <button type="button" style={S.ghostBtn} onClick={onBack} disabled={submitting}>← Edit</button>
        <button type="button" style={{ ...S.primaryBtn, opacity: submitting ? 0.7 : 1 }} onClick={onSubmit} disabled={submitting}>
          {submitting ? "Submitting…" : "Submit"}
        </button>
      </div>

      <p style={{ fontSize: "0.7rem", color: "#8b9db8", marginTop: "1rem", lineHeight: 1.5 }}>
        Sightings appear under the ScubaSeason observer account on conservation platforms.
      </p>
    </div>
  );
}

function ConfirmThumb({ file }: { file: File }) {
  const [url, setUrl] = useState<string | null>(null);
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => { const u = URL.createObjectURL(file); setUrl(u); return () => URL.revokeObjectURL(u); }, [file]);
  /* eslint-enable react-hooks/set-state-in-effect */
  if (!url) return null;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} alt="" style={{ width: 56, height: 56, objectFit: "cover", borderRadius: "0.4rem" }} />;
}

// ─── Step 5: Success ──────────────────────────────────────────────────────────

function StepSuccess({ siteName, observationUrl, submittedTo, onAnother }: {
  siteName: string;
  observationUrl?: string;
  submittedTo?: string[];
  onAnother: () => void;
}) {
  return (
    <div style={{ textAlign: "center", padding: "1rem 0" }}>
      <p style={{ fontSize: "2rem", marginBottom: "0.75rem" }}>🪸</p>
      <h4 style={{ fontSize: "1.05rem", fontWeight: 800, color: "#f0f4f8", marginBottom: "0.5rem" }}>Submitted. Thank you.</h4>
      <p style={{ fontSize: "0.875rem", color: "#aebcd0", lineHeight: 1.65, maxWidth: 420, margin: "0 auto 1.25rem" }}>
        Your photo is now part of {siteName}&apos;s reef record. iNaturalist&apos;s community of
        experts will help identify any unknown species within a few days.
      </p>
      {submittedTo && submittedTo.length > 0 && (
        <p style={{ fontSize: "0.8rem", color: "#8b9db8", marginBottom: "1.25rem" }}>
          Sent to: {submittedTo.join(", ")}
        </p>
      )}
      {observationUrl && (
        <a href={observationUrl} target="_blank" rel="noopener noreferrer"
          style={{ display: "inline-block", fontSize: "0.8125rem", color: "#00d4ff", fontWeight: 600, textDecoration: "none", marginBottom: "1.25rem" }}>
          View on iNaturalist →
        </a>
      )}
      <div>
        <button type="button" style={S.primaryBtn} onClick={onAnother}>Submit another sighting →</button>
      </div>
      <p style={{ fontSize: "0.7rem", color: "#8b9db8", marginTop: "1rem" }}>
        Sightings appear under the ScubaSeason observer account on conservation platforms.
      </p>
    </div>
  );
}

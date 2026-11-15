"use client";

import { useEffect, useRef, useState } from "react";
import Visualizer, { VISUALS, CATEGORIES } from "./Visualizer";

/* ---------- constants ---------- */

// 10-band graphic EQ. The outer bands are shelves, the rest are peaking filters.
const BANDS = [32, 64, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];
const bandLabel = (f) => (f >= 1000 ? `${f / 1000}k` : `${f}`);
const FLAT = BANDS.map(() => 0);
const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];
const EQ_MIN = -12;
const EQ_MAX = 12;
const EQ_KEY = "sonicflow-eq";
const THEME_KEY = "sonicflow-theme";
const VISUAL_KEY = "sonicflow-visual";
const VISUAL_TIP_KEY = "sonicflow-visual-tip-seen";
const NO_AUDIO = { current: null }; // previews run on the synthetic beat when nothing is playing

const SparkleIcon = ({ className = "h-4 w-4" }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M10 3.5l1.8 4.9 4.9 1.8-4.9 1.8L10 16.9l-1.8-4.9-4.9-1.8 4.9-1.8z" />
    <path d="M18 13l.9 2.3 2.3.9-2.3.9L18 19.4l-.9-2.3-2.3-.9 2.3-.9z" />
  </svg>
);
const ExpandIcon = ({ className = "h-4 w-4" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
  </svg>
);

/* Gallery of background effects, each tile a live preview. */
function VisualPicker({ value, onChange, onClose, onFullscreen, canFullscreen, analyserRef, playing, hue, onStage = false }) {
  // Open on the category of the current effect.
  const [cat, setCat] = useState(() => VISUALS.find((v) => v.id === value)?.cat || "all");
  const groups = (cat === "all" ? CATEGORIES.filter((c) => c.id !== "all") : CATEGORIES.filter((c) => c.id === cat)).map((c) => ({
    ...c,
    items: VISUALS.filter((v) => v.cat === c.id),
  }));
  if (cat === "all") groups.push({ id: "none", name: "", items: VISUALS.filter((v) => !v.cat) });

  // Search runs across every effect, regardless of the chosen mood.
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const results = q
    ? [{ id: "search", name: "", items: VISUALS.filter((v) => `${v.name} ${v.desc} ${CATEGORIES.find((c) => c.id === v.cat)?.name || ""}`.toLowerCase().includes(q)) }]
    : groups;

  const current = VISUALS.find((v) => v.id === value);
  const currentCat = CATEGORIES.find((c) => c.id === current?.cat);

  const chipRefs = useRef({});
  const listRef = useRef(null);
  // Keep the active mood visible in the scrolling row and start the list at the top.
  useEffect(() => {
    chipRefs.current[cat]?.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
    listRef.current?.scrollTo({ top: 0 });
  }, [cat]);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  // Swipe the sheet down to dismiss (touch / pen only).
  const [dragY, setDragY] = useState(0);
  const dragStart = useRef(null);
  const dragHandlers = {
    onPointerDown: (e) => {
      if (e.pointerType === "mouse" || e.target.closest("button")) return;
      dragStart.current = e.clientY;
      e.currentTarget.setPointerCapture?.(e.pointerId);
    },
    onPointerMove: (e) => {
      if (dragStart.current == null) return;
      setDragY(Math.max(0, e.clientY - dragStart.current));
    },
    onPointerUp: () => {
      if (dragStart.current == null) return;
      dragStart.current = null;
      if (dragY > 110) onClose();
      else setDragY(0);
    },
    onPointerCancel: () => {
      dragStart.current = null;
      setDragY(0);
    },
  };

  const note = (id) =>
    ({
      sleep: "Slow, dim and calm on purpose, with no flashing. Made for lullabies and bedtime.",
      meal: "Happy cartoon friends that sing and dance along. Great for keeping little ones smiling at mealtime.",
      camera: "Tap an effect to turn on your camera. The video stays on this device. Nothing is recorded or uploaded.",
    })[id];

  return (
    <div
      className={`vfx-backdrop fixed inset-0 ${onStage ? "z-[60]" : "z-40"} flex items-end justify-center bg-black/45 backdrop-blur-md sm:items-center sm:p-6`}
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="vfx-title"
        onClick={(e) => e.stopPropagation()}
        className="vfx-sheet glass-sheet relative flex h-[94dvh] w-full max-w-5xl flex-col overflow-hidden rounded-t-[28px] sm:h-[min(86dvh,860px)] sm:rounded-[32px]"
        style={{
          color: "var(--text)",
          transform: dragY ? `translateY(${dragY}px)` : undefined,
          transition: dragStart.current != null ? "none" : "transform .3s cubic-bezier(.32,.72,0,1)",
        }}
      >
        <div {...dragHandlers} className="vfx-drag shrink-0 touch-none sm:touch-auto">
        {/* Grabber (phones) */}
        <div className="vfx-grabber flex justify-center pt-2 sm:hidden" aria-hidden>
          <span className="h-[5px] w-9 rounded-full" style={{ background: "var(--track, rgba(127,127,127,.4))" }} />
        </div>

        {/* Header */}
        <div className="vfx-header flex items-center justify-between gap-3 px-4 pb-2.5 pt-2 sm:items-start sm:gap-4 sm:px-8 sm:pb-3 sm:pt-7">
          <div className="min-w-0">
            <p className="hidden items-center gap-1.5 text-[13px] font-semibold uppercase tracking-[0.06em] sm:flex" style={{ color: "var(--accent)" }}>
              <SparkleIcon className="h-3.5 w-3.5" />
              Visuals
            </p>
            <h3 id="vfx-title" className="flex items-center gap-1.5 text-[22px] font-bold leading-tight tracking-[-0.02em] sm:mt-0.5 sm:text-[32px]">
              <span className="sm:hidden" style={{ color: "var(--accent)" }}><SparkleIcon className="h-5 w-5" /></span>
              Visual Effects
            </h3>
            <p className="mt-1 hidden text-[15px] sm:block" style={{ color: "var(--muted)" }}>
              Backgrounds that move with your music.
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="tap flex h-9 w-9 shrink-0 items-center justify-center rounded-full sm:mt-1"
            style={{ background: "var(--hover)", color: "var(--muted)" }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="h-3.5 w-3.5">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        </div>

        {/* Search */}
        <div className="shrink-0 px-4 pb-2.5 sm:px-8 sm:pb-3">
          <label className="flex h-10 items-center gap-2 rounded-xl px-3" style={{ background: "var(--hover)" }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" className="h-4 w-4 shrink-0" style={{ color: "var(--muted)" }}>
              <circle cx="11" cy="11" r="6.5" />
              <path d="M20 20l-4-4" />
            </svg>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search effects"
              aria-label="Search effects"
              enterKeyHint="search"
              // 16px on phones stops iOS Safari from zooming in on focus.
              className="h-full min-w-0 flex-1 bg-transparent text-[16px] outline-none placeholder:opacity-60 sm:text-[15px]"
              style={{ color: "var(--text)" }}
            />
            {query && (
              <button onClick={() => setQuery("")} aria-label="Clear search" className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-white" style={{ background: "var(--muted)" }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="h-2.5 w-2.5">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            )}
          </label>
        </div>

        {/* Mood categories: always one row, swipe or scroll sideways */}
        {!q && (
          <div className="relative shrink-0">
            <div
              className="scroll-x-thin fade-x flex gap-1.5 overflow-x-auto scroll-smooth px-4 pb-2.5 sm:gap-2 sm:px-8"
              role="tablist"
              aria-label="Effect categories"
              onWheel={(e) => {
                const el = e.currentTarget;
                if (el.scrollWidth > el.clientWidth && Math.abs(e.deltaY) > Math.abs(e.deltaX)) el.scrollLeft += e.deltaY;
              }}
            >
              {CATEGORIES.map((c) => {
                const active = cat === c.id;
                return (
                  <button
                    key={c.id}
                    ref={(el) => (chipRefs.current[c.id] = el)}
                    role="tab"
                    aria-selected={active}
                    onClick={() => setCat(c.id)}
                    className="tap flex h-8 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3 text-[13px] font-medium sm:h-9 sm:px-3.5 sm:text-[14px]"
                    style={{
                      background: active ? "var(--text)" : "var(--hover)",
                      color: active ? "var(--bg)" : "var(--text)",
                      boxShadow: active ? "0 4px 14px rgba(0,0,0,.18)" : "none",
                    }}
                  >
                    <span aria-hidden className="text-[15px] leading-none">{c.emoji}</span>
                    {c.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="h-px shrink-0" style={{ background: "var(--border)" }} />

        {/* Effects */}
        <div
          ref={listRef}
          className="scroll-thin min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-6 pt-3 sm:px-8 sm:pt-4"
          role="radiogroup"
          aria-label="Background animation"
        >
          {q && results[0].items.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="text-[17px] font-semibold">No results</p>
              <p className="mt-1 text-[14px]" style={{ color: "var(--muted)" }}>
                Try another word, like “calm” or “party”.
              </p>
            </div>
          )}
          {results.map((g) => (
            <section key={g.id} className="mb-6 last:mb-0 sm:mb-7">
              {cat === "all" && !q && g.name && (
                <h4 className="mb-2.5 flex items-baseline gap-2 text-[18px] font-bold sm:mb-3 sm:text-[20px] tracking-[-0.01em]">
                  <span aria-hidden className="text-[18px]">{g.emoji}</span>
                  {g.name}
                  <span className="text-[13px] font-medium" style={{ color: "var(--muted)" }}>{g.items.length}</span>
                </h4>
              )}
              {!q && note(g.id) && (
                <p className="mb-3 flex items-start gap-2 rounded-2xl px-3.5 py-2.5 text-[13px] leading-snug" style={{ background: "var(--accent-soft)" }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="mt-px h-4 w-4 shrink-0" style={{ color: "var(--accent)" }}>
                    <circle cx="12" cy="12" r="9" />
                    <path d="M12 11v5M12 8h.01" />
                  </svg>
                  {note(g.id)}
                </p>
              )}
              <div className="grid grid-cols-2 gap-x-3 gap-y-4 min-[560px]:grid-cols-3 sm:gap-x-5 sm:gap-y-5 lg:grid-cols-4">
                {g.items.map((v) => {
                  const active = value === v.id;
                  return (
                    <button
                      key={v.id}
                      role="radio"
                      aria-checked={active}
                      onClick={() => onChange(v.id)}
                      className="vfx-card group min-w-0 rounded-[18px] text-left outline-none"
                    >
                      <div
                        className="relative aspect-video overflow-hidden rounded-[14px] bg-[#0b0b10] sm:rounded-[16px] transition-[box-shadow,transform] duration-300 ease-out group-hover:-translate-y-0.5 group-hover:shadow-xl group-active:scale-[0.97]"
                        style={{
                          boxShadow: active
                            ? "0 0 0 2.5px var(--card-solid), 0 0 0 5px var(--accent), 0 10px 24px rgba(0,0,0,.25)"
                            : "0 1px 2px rgba(0,0,0,.12), 0 0 0 0.5px var(--border)",
                        }}
                      >
                        {v.id === "off" ? (
                          <div className="flex h-full items-center justify-center text-xs text-white/50">No animation</div>
                        ) : (
                          <Visualizer mode={v.id} analyserRef={playing ? analyserRef : NO_AUDIO} playing hue={hue} intense preview />
                        )}
                        {active && (
                          <span
                            className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full text-white shadow-lg ring-2 ring-white/90"
                            style={{ background: "var(--accent)" }}
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
                              <path d="M5 12.5l4.5 4.5L19 7.5" />
                            </svg>
                          </span>
                        )}
                      </div>
                      <div className="px-0.5 pt-1.5 sm:px-1 sm:pt-2">
                        <div className="truncate text-[14px] font-semibold leading-5 sm:text-[15px]" style={{ color: active ? "var(--accent)" : "var(--text)" }}>
                          {v.name}
                        </div>
                        <div className="line-clamp-1 text-[12px] leading-[1.3] sm:line-clamp-2 sm:text-[13px]" style={{ color: "var(--muted)" }}>{v.desc}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
        </div>

        {/* Footer */}
        <div
          className="glass-bar flex shrink-0 items-center justify-between gap-3 border-t px-4 pt-2.5 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-8 sm:py-4"
          style={{ borderColor: "var(--border)" }}
        >
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] text-[16px] sm:h-9 sm:w-9 sm:rounded-xl sm:text-[17px]" style={{ background: "var(--accent-soft)" }} aria-hidden>
              {currentCat?.emoji || "✨"}
            </span>
            <div className="min-w-0">
              <div className="truncate text-[15px] font-semibold leading-5">{current?.name || "None"}</div>
              <div className="truncate text-[12px]" style={{ color: "var(--muted)" }}>
                {!onStage && !canFullscreen ? (
                  "Play a song to watch full screen"
                ) : (
                  <span className="hidden sm:inline">
                    Press <kbd className="rounded-md border px-1 font-mono text-[11px]" style={{ borderColor: "var(--border)" }}>F</kbd> any time for full screen
                  </span>
                )}
                {(onStage || canFullscreen) && <span className="sm:hidden">{currentCat?.name || "Selected effect"}</span>}
              </div>
            </div>
          </div>
          <div className="flex shrink-0 gap-2">
            <button onClick={onClose} className={`tap h-10 rounded-full px-5 text-[15px] font-semibold sm:h-11 ${onStage ? "" : "hidden sm:block"}`} style={{ background: "var(--hover)" }}>
              Done
            </button>
            {!onStage && (
              <button
                onClick={onFullscreen}
                disabled={!canFullscreen}
                title={canFullscreen ? "" : "Play a song first (YouTube videos playing on the page can't go full screen)"}
                className={`tap flex h-10 items-center justify-center gap-2 whitespace-nowrap rounded-full px-4 text-[15px] font-semibold sm:h-11 sm:px-5 ${canFullscreen ? "text-white" : "cursor-not-allowed"}`}
                style={
                  canFullscreen
                    ? { background: "var(--accent)", boxShadow: "0 6px 18px -4px var(--accent)" }
                    : { background: "var(--hover)", color: "var(--muted)" }
                }
              >
                <ExpandIcon />
                Full Screen
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const PRESETS = [
  { id: "flat", label: "Flat", gains: FLAT },
  { id: "bass", label: "Bass Boost", gains: [7, 6, 5, 3, 1, 0, 0, 0, 0, 0] },
  { id: "treble", label: "Treble Boost", gains: [0, 0, 0, 0, 0, 1, 2, 4, 5, 6] },
  { id: "vocal", label: "Vocal", gains: [-2, -2, -1, 1, 3, 4, 3, 2, 0, -1] },
  { id: "loud", label: "Loudness", gains: [6, 5, 3, 0, -1, 0, 1, 3, 4, 5] },
  { id: "rock", label: "Rock", gains: [5, 4, 2, -1, -2, -1, 2, 3, 4, 4] },
  { id: "electronic", label: "Electronic", gains: [6, 5, 2, 0, -2, 1, 0, 2, 4, 5] },
  { id: "acoustic", label: "Acoustic", gains: [3, 3, 2, 1, 1, 1, 2, 3, 2, 1] },
];

// Simple mode: Bass and Treble each drive a few bands, tapering towards the mids.
const BASS_SHAPE = [1, 1, 0.75, 0.35, 0, 0, 0, 0, 0, 0];
const TREBLE_SHAPE = [0, 0, 0, 0, 0, 0, 0.35, 0.75, 1, 1];
const gainsFromSimple = (bass, treble) => BANDS.map((_, i) => clampGain(bass * BASS_SHAPE[i] + treble * TREBLE_SHAPE[i]));

const sameGains =(a, b) => a.length === b.length && a.every((v, i) => v === b[i]);
const clampGain = (v) => Math.max(EQ_MIN, Math.min(EQ_MAX, Math.round(Number(v) || 0)));

// Reads the saved EQ; older versions stored only { bass, treble }.
function loadGains(saved) {
  if (Array.isArray(saved?.gains) && saved.gains.length === BANDS.length) return saved.gains.map(clampGain);
  if (saved && ("bass" in saved || "treble" in saved))
    return BANDS.map((f) => clampGain(f <= 125 ? saved.bass : f >= 4000 ? saved.treble : 0));
  return null;
}

/* ---------- helpers ---------- */

const fmt = (s) => {
  if (!s || isNaN(s) || !isFinite(s)) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60).toString().padStart(2, "0");
  return `${m}:${sec}`;
};

const hueFor = (str = "") => {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) % 360;
  return h;
};

const pct = (v, min, max) => ((v - min) / (max - min)) * 100;

// Fill from the left (normal sliders) or from the centre (bipolar EQ sliders).
const fillStyle = (v, min, max, bipolar = false) => {
  const p = pct(v, min, max);
  if (!bipolar) return { "--lo": "0%", "--hi": `${p}%` };
  return { "--lo": `${Math.min(50, p)}%`, "--hi": `${Math.max(50, p)}%` };
};

// Builds the EQ chain and returns the filters in order (feed [0], output from the last).
function makeFilters(ctx, gains) {
  const filters = BANDS.map((freq, i) => {
    const f = ctx.createBiquadFilter();
    f.type = i === 0 ? "lowshelf" : i === BANDS.length - 1 ? "highshelf" : "peaking";
    f.frequency.value = freq;
    if (f.type === "peaking") f.Q.value = 1.41;
    f.gain.value = gains[i] || 0;
    return f;
  });
  filters.reduce((a, b) => (a.connect(b), b));
  return filters;
}

// MP3 settings chosen for maximum compatibility with Bluetooth / USB speakers.
const MP3_SAMPLE_RATE = 44100;
const MP3_KBPS = 320;

const yieldToUi = () => new Promise((r) => setTimeout(r, 0));

// Encodes rendered audio to MP3 in small chunks so the page stays responsive.
// Scales down if the EQ pushed peaks past 0 dBFS, so boosted bass doesn't crackle.
async function encodeMp3(buffer, onProgress) {
  const { Mp3Encoder } = await import("@breezystack/lamejs");
  const ch = buffer.numberOfChannels;
  const len = buffer.length;
  const channels = Array.from({ length: ch }, (_, i) => buffer.getChannelData(i));

  let peak = 0;
  for (const data of channels) for (let i = 0; i < len; i++) {
    const v = Math.abs(data[i]);
    if (v > peak) peak = v;
  }
  const gain = peak > 0.98 ? 0.98 / peak : 1;

  const toInt16 = (data, start, end) => {
    const out = new Int16Array(end - start);
    for (let i = start; i < end; i++) {
      const s = Math.max(-1, Math.min(1, data[i] * gain));
      out[i - start] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
    return out;
  };

  const encoder = new Mp3Encoder(ch, buffer.sampleRate, MP3_KBPS);
  const parts = [];
  const BLOCK = 1152 * 20;
  for (let i = 0; i < len; i += BLOCK) {
    const end = Math.min(i + BLOCK, len);
    const left = toInt16(channels[0], i, end);
    const mp3 = ch === 2 ? encoder.encodeBuffer(left, toInt16(channels[1], i, end)) : encoder.encodeBuffer(left);
    if (mp3.length) parts.push(new Uint8Array(mp3));
    if ((i / BLOCK) % 8 === 0) {
      onProgress?.(end / len);
      await yieldToUi();
    }
  }
  const tail = encoder.flush();
  if (tail.length) parts.push(new Uint8Array(tail));
  onProgress?.(1);
  return new Blob(parts, { type: "audio/mpeg" });
}

async function renderWithEq(file, gains, onStage) {
  onStage?.("eq", 0);
  const raw = await file.arrayBuffer();
  const Ctx = window.AudioContext || window.webkitAudioContext;
  const decodeCtx = new Ctx();
  const decoded = await decodeCtx.decodeAudioData(raw);
  decodeCtx.close();

  // Render at 44.1 kHz stereo (or mono) — the safest format for speakers.
  const channels = Math.min(2, decoded.numberOfChannels);
  const length = Math.ceil(decoded.duration * MP3_SAMPLE_RATE);
  const offline = new OfflineAudioContext(channels, length, MP3_SAMPLE_RATE);
  const src = offline.createBufferSource();
  src.buffer = decoded;
  const filters = makeFilters(offline, gains);
  src.connect(filters[0]);
  filters[filters.length - 1].connect(offline.destination);
  src.start();
  const rendered = await offline.startRendering();

  return encodeMp3(rendered, (p) => onStage?.("mp3", p));
}

/* ---------- YouTube ---------- */

const YT_PLACEHOLDER = "YouTube video";

// Accepts watch, youtu.be, shorts, embed, live and music.youtube.com links, or a bare 11-char id.
function parseYouTubeId(input = "") {
  const raw = input.trim();
  if (/^[\w-]{11}$/.test(raw)) return raw;
  try {
    const u = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
    const host = u.hostname.replace(/^(www\.|m\.|music\.)/, "");
    let id = null;
    if (host === "youtu.be") id = u.pathname.split("/")[1];
    else if (host === "youtube.com" || host === "youtube-nocookie.com") {
      id = u.searchParams.get("v") || u.pathname.match(/^\/(?:shorts|embed|live|v)\/([^/?#]+)/)?.[1];
    }
    return id && /^[\w-]{11}$/.test(id) ? id : null;
  } catch {
    return null;
  }
}

// Loads the IFrame API into `win` (this page, or the EQ player popup). Cached per window.
function loadYouTubeApi(win = window) {
  if (win.YT?.Player) return Promise.resolve(win.YT);
  if (!win.__sfYtApi) {
    win.__sfYtApi = new Promise((resolve, reject) => {
      const prev = win.onYouTubeIframeAPIReady;
      win.onYouTubeIframeAPIReady = () => {
        prev?.();
        resolve(win.YT);
      };
      const s = win.document.createElement("script");
      s.src = "https://www.youtube.com/iframe_api";
      s.onerror = () => {
        win.__sfYtApi = null;
        reject(new Error("Couldn't load YouTube"));
      };
      win.document.head.appendChild(s);
    });
  }
  return win.__sfYtApi;
}

// Same-origin page that hosts the YouTube player while "EQ for YouTube" is on.
const YT_POPUP_URL = "/youtube-player.html";
const YT_POPUP_NAME = "sonicflow-youtube";

function waitForPopup(win) {
  return new Promise((resolve, reject) => {
    const started = Date.now();
    const check = () => {
      if (win.closed) return reject(new Error("closed"));
      let host = null;
      try {
        if (win.document.readyState === "complete") host = win.document.getElementById("player");
      } catch {}
      if (host) return resolve(host);
      if (Date.now() - started > 15000) return reject(new Error("timeout"));
      setTimeout(check, 100);
    };
    check();
  });
}

/* ---------- icons ---------- */

const Icon = {
  play: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-full w-full">
      <path d="M8 5.14v13.72a1 1 0 0 0 1.5.86l11.04-6.86a1 1 0 0 0 0-1.72L9.5 4.28A1 1 0 0 0 8 5.14z" />
    </svg>
  ),
  pause: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-full w-full">
      <rect x="6" y="4.5" width="4" height="15" rx="1.2" />
      <rect x="14" y="4.5" width="4" height="15" rx="1.2" />
    </svg>
  ),
  next: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-full w-full">
      <path d="M3 6.5v11a1 1 0 0 0 1.53.85L12 13.6v3.9a1 1 0 0 0 1.53.85l8.8-5.5a1 1 0 0 0 0-1.7l-8.8-5.5A1 1 0 0 0 12 6.5v3.9L4.53 5.65A1 1 0 0 0 3 6.5z" />
    </svg>
  ),
  prev: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-full w-full -scale-x-100">
      <path d="M3 6.5v11a1 1 0 0 0 1.53.85L12 13.6v3.9a1 1 0 0 0 1.53.85l8.8-5.5a1 1 0 0 0 0-1.7l-8.8-5.5A1 1 0 0 0 12 6.5v3.9L4.53 5.65A1 1 0 0 0 3 6.5z" />
    </svg>
  ),
  plus: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" className="h-full w-full">
      <path d="M12 5v14M5 12h14" />
    </svg>
  ),
  download: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-full w-full">
      <path d="M12 4v11m0 0l-4.5-4.5M12 15l4.5-4.5M5 19h14" />
    </svg>
  ),
  note: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-full w-full">
      <path d="M19 3.5v11.25a3.25 3.25 0 1 1-2-3V7.6l-8 1.78v7.37a3.25 3.25 0 1 1-2-3V6.5a1 1 0 0 1 .78-.98l10-2.22A1 1 0 0 1 19 4.28z" />
    </svg>
  ),
  volLow: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-full w-full">
      <path d="M4 9.5h3l4.4-3.7A1 1 0 0 1 13 6.6v10.8a1 1 0 0 1-1.6.8L7 14.5H4a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1z" />
    </svg>
  ),
  volHigh: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-full w-full">
      <path d="M3 9.5h3l4.4-3.7A1 1 0 0 1 12 6.6v10.8a1 1 0 0 1-1.6.8L6 14.5H3a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1z" />
      <path d="M15 8.5a5 5 0 0 1 0 7M17.8 5.7a9 9 0 0 1 0 12.6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  ),
  sun: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-full w-full">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  ),
  moon: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-full w-full">
      <path d="M20.5 14.6A8.5 8.5 0 0 1 9.4 3.5a8.5 8.5 0 1 0 11.1 11.1z" />
    </svg>
  ),
  tabPlayer: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-full w-full">
      <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm-2 6.3a.8.8 0 0 1 1.2-.7l5.6 3.7a.8.8 0 0 1 0 1.4l-5.6 3.7a.8.8 0 0 1-1.2-.7z" />
    </svg>
  ),
  tabSound: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" className="h-full w-full">
      <path d="M6 3v6M6 15v6M12 3v12M12 19v2M18 3v2M18 9v12" />
      <circle cx="6" cy="12" r="2.4" fill="currentColor" />
      <circle cx="12" cy="17" r="2.4" fill="currentColor" />
      <circle cx="18" cy="7" r="2.4" fill="currentColor" />
    </svg>
  ),
  tabLibrary: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-full w-full">
      <rect x="3" y="3" width="4" height="18" rx="1.2" />
      <rect x="9" y="3" width="4" height="18" rx="1.2" />
      <path d="M15.4 4.6a1.2 1.2 0 0 1 1.5-.8l1.9.6a1.2 1.2 0 0 1 .8 1.5l-4.4 14.3a1.2 1.2 0 0 1-1.5.8" opacity=".9" />
    </svg>
  ),
  auto: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-full w-full">
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 3.5a8.5 8.5 0 0 1 0 17z" fill="currentColor" />
    </svg>
  ),
};

/* ---------- small components ---------- */

function Artwork({ name, image, size = "full", playing, video = false }) {
  const h = hueFor(name);
  return (
    <div
      className={`relative flex ${video ? "aspect-video" : "aspect-square"} items-center justify-center overflow-hidden ${
        size === "full" ? "w-full rounded-[22px] shadow-2xl" : "h-11 w-11 shrink-0 rounded-lg"
      }`}
      style={{
        background: image
          ? `center / cover no-repeat url("${image}"), #000`
          : name
          ? `linear-gradient(135deg, hsl(${h} 80% 62%), hsl(${(h + 50) % 360} 75% 45%) 55%, hsl(${(h + 110) % 360} 70% 30%))`
          : "var(--track)",
      }}
    >
      {!image && <div className={`${size === "full" ? "h-1/4 w-1/4" : "h-5 w-5"} text-white/85 drop-shadow`}>{Icon.note}</div>}
      {size !== "full" && playing && (
        <div className="absolute inset-0 flex items-end justify-center gap-[3px] bg-black/40 pb-3">
          {[0, 0.2, 0.4].map((d) => (
            <span key={d} className="eq-bar h-4 w-[3px] rounded-full bg-white" style={{ animationDelay: `${d}s` }} />
          ))}
        </div>
      )}
    </div>
  );
}

function Segmented({ options, value, onChange, label }) {
  return (
    <div role="radiogroup" aria-label={label} className="flex rounded-full p-1" style={{ background: "var(--hover)" }}>
      {options.map((o) => {
        const active = value === o.value;
        return (
          <button
            key={o.value}
            role="radio"
            aria-checked={active}
            aria-label={o.title || o.label}
            title={o.title || o.label}
            onClick={() => onChange(o.value)}
            className="tap flex flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium"
            style={{
              background: active ? "var(--card-solid)" : "transparent",
              color: active ? "var(--text)" : "var(--muted)",
              boxShadow: active ? "0 1px 4px rgba(0,0,0,.15)" : "none",
            }}
          >
            {o.icon && <span className="h-3.5 w-3.5">{o.icon}</span>}
            {o.label && <span>{o.label}</span>}
          </button>
        );
      })}
    </div>
  );
}

// Big horizontal slider for Simple mode (easy to drag with a thumb). Double-click resets to 0.
function SimpleSlider({ label, hint, value, onChange, disabled = false }) {
  return (
    <div className={disabled ? "pointer-events-none opacity-40" : undefined} aria-disabled={disabled}>
      <div className="mb-2 flex items-baseline justify-between">
        <div>
          <span className="text-[15px] font-medium">{label}</span>
          <span className="ml-2 text-xs" style={{ color: "var(--muted)" }}>
            {hint}
          </span>
        </div>
        <span className="tabular-nums text-sm font-semibold" style={{ color: value ? "var(--accent)" : "var(--muted)" }}>
          {value > 0 ? "+" : ""}
          {value} dB
        </span>
      </div>
      <input
        type="range"
        min={EQ_MIN}
        max={EQ_MAX}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        onDoubleClick={() => onChange(0)}
        disabled={disabled}
        aria-label={`${label} gain`}
        className="slider accent"
        style={fillStyle(value, EQ_MIN, EQ_MAX, true)}
      />
      <div className="mt-1.5 flex justify-between text-[10px] font-medium" style={{ color: "var(--muted)" }}>
        <span>{EQ_MIN}</span>
        <span>0</span>
        <span>+{EQ_MAX}</span>
      </div>
    </div>
  );
}

// Graphic EQ: one vertical slider per band. Double-click a band to reset it to 0 dB.
function GraphicEq({ gains, onChange, disabled = false }) {
  const setBand = (i, v) => onChange(gains.map((g, j) => (j === i ? v : g)));
  return (
    <div className={`flex gap-2 ${disabled ? "pointer-events-none opacity-40" : ""}`} aria-disabled={disabled}>
      <div className="flex shrink-0 flex-col justify-between pb-6 pt-5 text-right text-[10px] font-medium tabular-nums" style={{ color: "var(--muted)" }}>
        <span>+{EQ_MAX}</span>
        <span>0</span>
        <span>{EQ_MIN}</span>
      </div>
      <div className="relative grid min-w-0 flex-1 grid-cols-10">
        {/* 0 dB guide line */}
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-[calc(1.25rem+70px)] h-px" style={{ background: "var(--track)" }} />
        {BANDS.map((f, i) => {
          const v = gains[i];
          return (
            <div key={f} className="flex flex-col items-center">
              <span className="h-5 text-[10px] font-semibold tabular-nums leading-5" style={{ color: v ? "var(--accent)" : "var(--muted)" }}>
                {v > 0 ? `+${v}` : v}
              </span>
              <input
                type="range"
                min={EQ_MIN}
                max={EQ_MAX}
                step={1}
                value={v}
                onChange={(e) => setBand(i, Number(e.target.value))}
                onDoubleClick={() => setBand(i, 0)}
                disabled={disabled}
                aria-label={`${bandLabel(f)} Hz gain`}
                aria-valuetext={`${v} dB`}
                className="slider vertical accent"
                style={fillStyle(v, EQ_MIN, EQ_MAX, true)}
              />
              <span className="mt-2 h-4 text-[10px] font-medium" style={{ color: "var(--muted)" }}>
                {bandLabel(f)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- main ---------- */

export default function MusicPlayer() {
  const audioRef = useRef(null);
  const ctxRef = useRef(null);
  const filtersRef = useRef([]);
  const analyserRef = useRef(null);
  const fileInputRef = useRef(null);
  const pendingPlay = useRef(false);
  const ytHostRef = useRef(null);
  const ytRef = useRef(null); // ready YT.Player instance
  const ytPromiseRef = useRef(null);
  const ytLoadedId = useRef(null); // videoId currently loaded in the player
  const ytEvents = useRef({});
  // "EQ for YouTube": the player lives in a popup whose tab audio we capture and EQ.
  const ytPopupRef = useRef(null);
  const ytStreamRef = useRef(null);
  const ytStreamSrcRef = useRef(null);
  const ytGen = useRef(0); // bumped when the player is torn down, so late onReady calls are ignored

  const [tracks, setTracks] = useState([]);
  const [ytUrl, setYtUrl] = useState("");
  const [current, setCurrent] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [speed, setSpeed] = useState(1); // playback rate (0.5x – 2x)
  const [gains, setGains] = useState(FLAT);
  const [eqMode, setEqMode] = useState("simple"); // "simple" (Bass + Treble) | "bands" (10-band)
  // off → popup (player moved to its window, waiting for the share) → live (audio captured + EQ'd)
  const [ytEq, setYtEq] = useState("off");
  // Only Chromium browsers (Chrome, Edge) can share a tab's audio; Firefox and Safari share video only.
  const [tabAudioOk, setTabAudioOk] = useState(true);
  useEffect(() => {
    try {
      setTabAudioOk(!!navigator.mediaDevices?.getDisplayMedia && !!navigator.mediaDevices.getSupportedConstraints?.().suppressLocalAudioPlayback);
    } catch {
      setTabAudioOk(false);
    }
  }, []);
  const [theme, setTheme] = useState("system");
  const [exporting, setExporting] = useState(false);
  const [exportStage, setExportStage] = useState({ stage: "eq", p: 0 });
  const [toast, setToast] = useState("");
  const [dragging, setDragging] = useState(false);
  // Mobile tabs; on large screens every panel is visible at once.
  const [tab, setTab] = useState("player");
  // Background animation + full-screen "stage" view
  const [visual, setVisual] = useState("aurora");
  const [stage, setStage] = useState(false);
  const [stageUi, setStageUi] = useState(true);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [visualTip, setVisualTip] = useState(false); // first-time "new feature" hint
  const show = (name) => (tab === name ? "flex" : "hidden lg:flex");

  const track = tracks[current];
  const isYt = track?.kind === "youtube";
  const eqActive = !isYt || ytEq === "live";
  const hue = hueFor(track?.name);
  const canStage = !!track && !(isYt && ytEq === "off");

  /* --- load saved settings --- */
  useEffect(() => {
    try {
      const eq = JSON.parse(localStorage.getItem(EQ_KEY) || "null");
      const saved = loadGains(eq);
      if (saved) setGains(saved);
      if (eq?.mode === "bands" || eq?.mode === "simple") setEqMode(eq.mode);
      const t = localStorage.getItem(THEME_KEY);
      if (t === "light" || t === "dark") setTheme(t);
      const v = localStorage.getItem(VISUAL_KEY);
      if (VISUALS.some((x) => x.id === v)) setVisual(v);
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(EQ_KEY, JSON.stringify({ gains, mode: eqMode }));
    } catch {}
  }, [gains, eqMode]);

  // Show the hint once, the first time there's music to visualise.
  useEffect(() => {
    if (!track) return;
    try {
      if (!localStorage.getItem(VISUAL_TIP_KEY)) {
        const id = setTimeout(() => setVisualTip(true), 1200);
        return () => clearTimeout(id);
      }
    } catch {}
  }, [!!track]);
  const dismissVisualTip = () => {
    setVisualTip(false);
    try {
      localStorage.setItem(VISUAL_TIP_KEY, "1");
    } catch {}
  };
  const openPicker = () => {
    dismissVisualTip();
    setPickerOpen(true);
  };

  const changeVisual = (v) => {
    setVisual(v);
    try {
      localStorage.setItem(VISUAL_KEY, v);
    } catch {}
  };

  /* --- full-screen stage --- */
  const enterStage = () => {
    dismissVisualTip();
    setPickerOpen(false);
    setStage(true);
    setStageUi(true);
    document.documentElement.requestFullscreen?.().catch(() => {});
  };
  const exitStage = () => {
    setStage(false);
    if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
  };
  // Leaving browser full screen (Esc / F11) also closes the stage.
  useEffect(() => {
    const onFs = () => !document.fullscreenElement && setStage(false);
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);
  // Hide the stage controls after a few seconds without mouse/touch activity.
  useEffect(() => {
    if (!stage) return;
    let id;
    const wake = () => {
      setStageUi(true);
      clearTimeout(id);
      id = setTimeout(() => setStageUi(false), 3000);
    };
    wake();
    window.addEventListener("pointermove", wake);
    window.addEventListener("pointerdown", wake);
    window.addEventListener("keydown", wake);
    return () => {
      clearTimeout(id);
      window.removeEventListener("pointermove", wake);
      window.removeEventListener("pointerdown", wake);
      window.removeEventListener("keydown", wake);
    };
  }, [stage]);

  /* --- theme --- */
  const changeTheme = (t) => {
    setTheme(t);
    const root = document.documentElement;
    if (t === "system") root.removeAttribute("data-theme");
    else root.setAttribute("data-theme", t);
    try {
      if (t === "system") localStorage.removeItem(THEME_KEY);
      else localStorage.setItem(THEME_KEY, t);
    } catch {}
  };

  /* --- audio graph --- */
  const initAudio = () => {
    if (ctxRef.current) return;
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const source = ctx.createMediaElementSource(audioRef.current);
    const filters = makeFilters(ctx, gains);
    source.connect(filters[0]);
    filters[filters.length - 1].connect(ctx.destination);
    // Side tap for the visualizer (doesn't change what you hear).
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 2048;
    analyser.smoothingTimeConstant = 0.75;
    filters[filters.length - 1].connect(analyser);
    analyserRef.current = analyser;
    ctxRef.current = ctx;
    filtersRef.current = filters;
  };

  // Smoothly apply EQ changes to the live filters.
  useEffect(() => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    filtersRef.current.forEach((f, i) => f.gain.setTargetAtTime(gains[i], ctx.currentTime, 0.03));
  }, [gains]);

  /* --- YouTube player (official embed, created on first use) --- */
  // Where the player lives: inline on the page, or in the EQ popup window.
  const ytWindow = () => (ytPopupRef.current && !ytPopupRef.current.closed ? ytPopupRef.current : null);

  const getYT = () => {
    if (!ytPromiseRef.current) {
      const popup = ytWindow();
      const win = popup || window;
      const gen = ytGen.current;
      // Wait for the popup page to finish loading first, or the API script would land in its about:blank.
      ytPromiseRef.current = (popup ? waitForPopup(popup) : Promise.resolve(ytHostRef.current))
        .then((host) => loadYouTubeApi(win).then((YT) => [YT, host]))
        .then(
          ([YT, host]) =>
            new Promise((resolve, reject) => {
              if (gen !== ytGen.current) return reject(new Error("stale"));
              // YT replaces this element with an iframe, so keep it outside React's tree.
              const el = win.document.createElement("div");
              host.appendChild(el);
              const p = new YT.Player(el, {
                width: "100%",
                height: "100%",
                // The popup keeps YouTube's own controls, so you can click play there if the browser blocks autoplay.
                playerVars: { playsinline: 1, controls: popup ? 1 : 0, rel: 0, disablekb: popup ? 0 : 1, iv_load_policy: 3 },
                events: {
                  onReady: () => {
                    if (gen !== ytGen.current) {
                      p.destroy();
                      return reject(new Error("stale"));
                    }
                    ytRef.current = p;
                    p.setVolume(Math.round(ytEvents.current.volume * 100));
                    p.setPlaybackRate?.(ytEvents.current.speed);
                    resolve(p);
                  },
                  onStateChange: (e) => ytEvents.current.onState(e.data, p),
                  onError: (e) => ytEvents.current.onError(e.data),
                },
              });
            })
        )
        .catch((err) => {
          ytPromiseRef.current = null;
          throw err;
        });
    }
    return ytPromiseRef.current;
  };

  const destroyYT = () => {
    ytGen.current++;
    try {
      ytRef.current?.destroy();
    } catch {}
    ytRef.current = null;
    ytPromiseRef.current = null;
    ytLoadedId.current = null;
    if (ytHostRef.current) ytHostRef.current.innerHTML = "";
  };

  // Rebuild the player in its current home (page or popup) and resume the same video.
  const moveYT = (resumeAt, resume) => {
    destroyYT();
    setPlaying(false);
    if (!isYt) return;
    ytLoadedId.current = track.videoId;
    getYT()
      .then((p) => {
        const opts = { videoId: track.videoId, startSeconds: resumeAt };
        resume ? p.loadVideoById(opts) : p.cueVideoById(opts);
      })
      .catch((e) => e.message !== "stale" && showToast("Couldn't load YouTube — check your connection"));
  };

  const ytPosition = () => {
    try {
      return ytRef.current?.getCurrentTime?.() ?? time;
    } catch {
      return time; // player's window is already gone
    }
  };

  // Step 1: move the YouTube player into a small popup window.
  const openYtEqPlayer = () => {
    const w = window.open(YT_POPUP_URL, YT_POPUP_NAME, "popup,width=560,height=360");
    if (!w) {
      showToast("Allow pop-ups for SonicFlow to use the EQ on YouTube");
      return;
    }
    const at = ytPosition();
    const wasPlaying = playing;
    ytPopupRef.current = w;
    setYtEq("popup");
    if (isYt) moveYT(at, wasPlaying);
  };

  const stopYtCapture = () => {
    ytStreamRef.current?.getTracks().forEach((t) => t.stop());
    try {
      ytStreamSrcRef.current?.disconnect();
    } catch {}
    ytStreamRef.current = null;
    ytStreamSrcRef.current = null;
    setYtEq(ytWindow() ? "popup" : "off");
  };

  // Step 2: capture the popup tab's audio (local playback suppressed) and run it through the EQ.
  const shareYtAudio = async () => {
    if (!navigator.mediaDevices?.getDisplayMedia) {
      showToast("This browser can't share tab audio. Try Chrome or Edge on a computer");
      return;
    }
    let stream;
    try {
      stream = await navigator.mediaDevices.getDisplayMedia({
        video: { displaySurface: "browser", frameRate: { max: 1 } },
        audio: { suppressLocalAudioPlayback: true, echoCancellation: false, noiseSuppression: false, autoGainControl: false },
        selfBrowserSurface: "exclude", // capturing SonicFlow itself would feed the EQ back into itself
        preferCurrentTab: false,
        surfaceSwitching: "exclude",
        systemAudio: "exclude",
        monitorTypeSurfaces: "exclude",
      });
    } catch {
      return; // share dialog cancelled
    }
    const audioTrack = stream.getAudioTracks()[0];
    if (!audioTrack) {
      stream.getTracks().forEach((t) => t.stop());
      showToast('Pick the "SonicFlow · YouTube" tab and keep "Share tab audio" on');
      return;
    }
    const handle = stream.getVideoTracks()[0]?.getCaptureHandle?.();
    if (handle && handle.handle !== YT_POPUP_NAME) showToast("Heads up: that's not the SonicFlow YouTube window");

    initAudio();
    const ctx = ctxRef.current;
    ctx.resume();
    const src = ctx.createMediaStreamSource(new MediaStream([audioTrack]));
    src.connect(filtersRef.current[0]);
    ytStreamRef.current?.getTracks().forEach((t) => t.stop());
    ytStreamRef.current = stream;
    ytStreamSrcRef.current = src;
    // "Stop sharing" in the browser bar ends the track; YouTube then plays normally (without EQ).
    audioTrack.addEventListener("ended", () => actionsRef.current.stopYtCapture());
    setYtEq("live");
  };

  // Turn it all off: stop capturing, close the popup, put the player back on the page.
  const closeYtEq = () => {
    const at = ytPosition();
    const wasPlaying = playing;
    stopYtCapture();
    const w = ytPopupRef.current;
    ytPopupRef.current = null;
    destroyYT();
    w?.close();
    setYtEq("off");
    if (isYt) moveYT(at, wasPlaying);
  };

  // If the popup gets closed by hand, fall back to the inline player.
  useEffect(() => {
    if (ytEq === "off") return;
    const id = setInterval(() => {
      if (ytPopupRef.current?.closed) actionsRef.current.closeYtEq();
    }, 800);
    return () => clearInterval(id);
  }, [ytEq]);

  useEffect(() => {
    const close = () => ytPopupRef.current?.close();
    window.addEventListener("pagehide", close);
    return () => window.removeEventListener("pagehide", close);
  }, []);

  const renameTrack = (id, patch) =>
    setTracks((prev) => {
      const i = prev.findIndex((t) => t.id === id);
      if (i < 0 || Object.keys(patch).every((k) => !patch[k] || prev[i][k] === patch[k])) return prev;
      const copy = [...prev];
      copy[i] = { ...prev[i], ...Object.fromEntries(Object.entries(patch).filter(([, v]) => v)) };
      return copy;
    });

  // Switch between the <audio> element and the YouTube player when the track changes.
  useEffect(() => {
    const t = tracks[current];
    const autoplay = pendingPlay.current;
    pendingPlay.current = false;

    if (t?.kind === "youtube") {
      audioRef.current?.pause();
      if (ytLoadedId.current !== t.videoId) {
        ytLoadedId.current = t.videoId;
        setPlaying(false);
        setTime(0);
        setDuration(0);
        getYT()
          .then((p) => (autoplay ? p.loadVideoById(t.videoId) : p.cueVideoById(t.videoId)))
          .catch(() => showToast("Couldn't load YouTube — check your connection"));
      } else if (autoplay) {
        ytRef.current?.playVideo();
      }
      return;
    }

    if (ytLoadedId.current) {
      ytLoadedId.current = null;
      ytRef.current?.pauseVideo();
      setPlaying(false);
      setTime(0);
    }
    if (autoplay && audioRef.current) {
      ctxRef.current?.resume();
      audioRef.current.play().catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, tracks]);

  // The YT player has no timeupdate event, so poll while it plays.
  useEffect(() => {
    if (!isYt || !playing) return;
    const id = setInterval(() => {
      const p = ytRef.current;
      if (!p?.getCurrentTime) return;
      setTime(p.getCurrentTime());
      const d = p.getDuration();
      if (d) setDuration(d);
    }, 250);
    return () => clearInterval(id);
  }, [isYt, playing]);

  /* --- library --- */
  const addFiles = (fileList) => {
    const files = Array.from(fileList || []).filter((f) => f.type.startsWith("audio/") || /\.(mp3|wav|m4a|aac|ogg|flac)$/i.test(f.name));
    if (!files.length) return;
    const newTracks = files.map((f) => ({
      id: `${f.name}-${f.size}-${f.lastModified}-${Math.random().toString(36).slice(2)}`,
      name: f.name.replace(/\.[^/.]+$/, ""),
      ext: (f.name.match(/\.([^/.]+)$/)?.[1] || "audio").toUpperCase(),
      url: URL.createObjectURL(f),
      file: f,
    }));
    setTracks((prev) => [...prev, ...newTracks]);
  };

  // Adds a YouTube link; plays it right away unless something is already playing.
  const addYouTube = (input) => {
    const videoId = parseYouTubeId(input);
    if (!videoId) {
      showToast("That doesn't look like a YouTube link");
      return false;
    }
    const id = `yt-${videoId}-${Math.random().toString(36).slice(2)}`;
    setTracks((prev) => [
      ...prev,
      { id, kind: "youtube", videoId, name: YT_PLACEHOLDER, ext: "YouTube", image: `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg` },
    ]);
    if (!playing) {
      pendingPlay.current = true;
      setCurrent(tracks.length);
      setTab("player");
    } else showToast("Added to your library");

    fetch(`https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(`https://www.youtube.com/watch?v=${videoId}`)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && renameTrack(id, { name: d.title, artist: d.author_name }))
      .catch(() => {});
    return true;
  };

  const removeTrack = (i) => {
    if (tracks[i].url) URL.revokeObjectURL(tracks[i].url);
    const nextTracks = tracks.filter((_, idx) => idx !== i);
    setTracks(nextTracks);
    if (i < current) setCurrent((c) => c - 1);
    else if (i === current) {
      setPlaying(false);
      setTime(0);
      setDuration(0);
      setCurrent(Math.min(current, Math.max(0, nextTracks.length - 1)));
    }
  };

  /* --- transport --- */
  const playIndex = (index) => {
    const t = tracks[index];
    if (index === current && t?.kind === "youtube") {
      getYT()
        .then((p) => {
          p.seekTo(0, true);
          p.playVideo();
        })
        .catch(() => {});
      return;
    }
    if (t?.kind !== "youtube") initAudio();
    if (index === current && audioRef.current?.src) {
      audioRef.current.currentTime = 0;
      ctxRef.current?.resume();
      audioRef.current.play().catch(() => {});
      return;
    }
    pendingPlay.current = true;
    setCurrent(index);
  };

  const togglePlay = () => {
    if (!track) return;
    if (isYt) {
      const p = ytRef.current;
      if (!p) return;
      const s = p.getPlayerState();
      if (s === 1 || s === 3) p.pauseVideo(); // playing / buffering
      else p.playVideo();
      return;
    }
    initAudio();
    ctxRef.current.resume();
    const audio = audioRef.current;
    if (audio.paused) audio.play().catch(() => {});
    else audio.pause();
  };

  const next = () => tracks.length && playIndex((current + 1) % tracks.length);
  const prev = () => {
    if (!tracks.length) return;
    if (time > 3) {
      seekTo(0);
      return;
    }
    playIndex((current - 1 + tracks.length) % tracks.length);
  };

  const onEnded = () => {
    if (current < tracks.length - 1) playIndex(current + 1);
    else setPlaying(false);
  };

  const seekTo = (t) => {
    t = Math.max(0, Math.min(t, duration || t));
    if (isYt) ytRef.current?.seekTo(t, true);
    else if (audioRef.current) audioRef.current.currentTime = t;
    setTime(t);
  };
  const seek = (e) => seekTo(Number(e.target.value));

  const changeVolume = (v) => {
    setVolume(v);
    audioRef.current.volume = v;
    ytRef.current?.setVolume(Math.round(v * 100));
  };

  const changeSpeed = (r) => {
    setSpeed(r);
    const a = audioRef.current;
    if (a) {
      a.defaultPlaybackRate = r; // survives track changes
      a.playbackRate = r;
      a.preservesPitch = true; // keep voices natural instead of chipmunk / slow-mo
    }
    try {
      ytRef.current?.setPlaybackRate(r);
    } catch {}
  };

  // Events from the YouTube player, routed through a ref so they always see fresh state.
  ytEvents.current = {
    volume,
    speed,
    onState: (state, p) => {
      if (!isYt) return;
      if (state === 1) {
        setPlaying(true);
        // YouTube resets the rate for each new video, so re-apply it.
        if (p.getPlaybackRate?.() !== speed) p.setPlaybackRate?.(speed);
        setDuration(p.getDuration());
        const title = p.getVideoData?.()?.title;
        if (track.name === YT_PLACEHOLDER && title) renameTrack(track.id, { name: title, artist: p.getVideoData().author });
      } else if (state === 2 || state === 5) {
        setPlaying(false);
        if (state === 5) setDuration(p.getDuration());
      } else if (state === 0) {
        setPlaying(false);
        onEnded();
      }
    },
    onError: (code) => {
      setPlaying(false);
      showToast(code === 101 || code === 150 ? "The owner doesn't allow this video outside YouTube" : "This YouTube video can't be played");
    },
  };

  // Space = play/pause, arrows = seek (ignored while typing or on sliders)
  useEffect(() => {
    const onKey = (e) => {
      if (e.target.closest?.("input, textarea, button, [role=dialog]")) return;
      const a = actionsRef.current;
      if (e.code === "Space") {
        e.preventDefault();
        a.togglePlay();
      } else if (e.code === "KeyF") a.toggleStage();
      else if (e.code === "Escape") a.exitStage();
      else if (e.code === "ArrowRight") a.seekBy(5);
      else if (e.code === "ArrowLeft") a.seekBy(-5);
    };
    // Pasting a YouTube link anywhere on the page (outside a text field) adds it.
    const onPaste = (e) => {
      if (e.target.closest?.("input, textarea")) return;
      const text = e.clipboardData?.getData("text") || "";
      if (parseYouTubeId(text)) {
        e.preventDefault();
        actionsRef.current.addYouTube(text);
      }
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("paste", onPaste);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("paste", onPaste);
    };
  }, []);

  // Lock-screen / notification controls on phones (Media Session API).
  const actionsRef = useRef({});
  actionsRef.current = { togglePlay, next, prev, seekTo, addYouTube, stopYtCapture, closeYtEq, exitStage, toggleStage: () => (stage ? exitStage() : canStage && enterStage()), seekBy: (d) => seekTo(time + d) };
  useEffect(() => {
    if (!("mediaSession" in navigator)) return;
    const ms = navigator.mediaSession;
    const a = actionsRef;
    const set = (action, fn) => {
      try {
        ms.setActionHandler(action, fn);
      } catch {}
    };
    set("play", () => a.current.togglePlay());
    set("pause", () => a.current.togglePlay());
    set("nexttrack", () => a.current.next());
    set("previoustrack", () => a.current.prev());
    set("seekto", (d) => {
      if (d.seekTime != null) a.current.seekTo(d.seekTime);
    });
  }, []);
  useEffect(() => {
    if (!("mediaSession" in navigator) || !track) return;
    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: track.name,
        artist: track.artist || "SonicFlow",
        album: track.ext,
        artwork: track.image ? [{ src: track.image, sizes: "320x180", type: "image/jpeg" }] : [],
      });
    } catch {}
  }, [track]);
  useEffect(() => {
    if ("mediaSession" in navigator) navigator.mediaSession.playbackState = playing ? "playing" : "paused";
  }, [playing]);

  /* --- EQ --- */
  const applyPreset = (id) => {
    const p = PRESETS.find((x) => x.id === id);
    if (p) setGains(p.gains);
  };
  const activePreset = PRESETS.find((p) => sameGains(p.gains, gains))?.id;
  const isFlat = sameGains(gains, FLAT);

  /* --- export --- */
  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3500);
  };

  const exportTrack = async () => {
    if (!track || exporting) return;
    setExporting(true);
    try {
      setExportStage({ stage: "eq", p: 0 });
      const blob = await renderWithEq(track.file, gains, (stage, p) => setExportStage({ stage, p }));
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const tag = PRESETS.find((p) => p.id === activePreset)?.label || "Custom EQ";
      a.href = url;
      a.download = `${track.name} (SonicFlow ${tag}).mp3`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      showToast("MP3 downloaded with your EQ applied");
    } catch (err) {
      console.error(err);
      showToast("Couldn't process this file");
    } finally {
      setExporting(false);
    }
  };

  /* --- drag & drop --- */
  const dropHandlers = {
    onDragOver: (e) => {
      e.preventDefault();
      setDragging(true);
    },
    onDragLeave: (e) => {
      if (e.currentTarget === e.target) setDragging(false);
    },
    onDrop: (e) => {
      e.preventDefault();
      setDragging(false);
      addFiles(e.dataTransfer.files);
    },
  };

  const muted = { color: "var(--muted)" };

  // Songs after the current one, wrapping round to the start.
  const upNext = tracks.map((_, k) => (current + 1 + k) % tracks.length).slice(0, tracks.length - 1);

  // One song in a list (Library, and "Up next" on phones). Tapping plays it.
  const trackRow = (i, removable) => {
    const t = tracks[i];
    const active = i === current;
    return (
      <div className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition-colors" style={{ background: active ? "var(--hover)" : "transparent" }}>
        <button onClick={() => playIndex(i)} className="tap flex min-w-0 flex-1 items-center gap-3 text-left">
          <Artwork name={t.name} image={t.image} size="sm" playing={active && playing} />
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium" style={{ color: active ? "var(--accent)" : "var(--text)" }}>
              {t.name}
            </div>
            <div className="truncate text-xs" style={muted}>
              {t.artist ? `${t.artist} · ` : ""}
              {t.ext}
            </div>
          </div>
        </button>
        {removable && (
          <button
            onClick={() => removeTrack(i)}
            aria-label={`Remove ${t.name}`}
            className="tap rounded-full px-3 py-2 text-xl leading-none opacity-60 hover:opacity-100 lg:px-2 lg:py-1 lg:text-lg lg:opacity-0 lg:group-hover:opacity-60"
            style={muted}
          >
            ×
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="relative min-h-[100dvh] overflow-hidden" {...dropHandlers}>
      {/* Music-reactive animated background (pick one under the volume slider) */}
      <div aria-hidden className="pointer-events-none fixed inset-0">
        {track?.image && (
          <div
            className="absolute inset-[-10%] bg-cover bg-center opacity-30 blur-[80px] saturate-150 transition-opacity duration-1000"
            style={{ backgroundImage: `url("${track.image}")` }}
          />
        )}
        {!stage && <Visualizer mode={visual} analyserRef={analyserRef} playing={playing} hue={hue} />}
      </div>

      <audio
        ref={audioRef}
        src={track?.url}
        onTimeUpdate={(e) => !isYt && setTime(e.target.currentTime)}
        onLoadedMetadata={(e) => {
          e.target.playbackRate = speed;
          if (!isYt) setDuration(e.target.duration);
        }}
        onPlay={() => !isYt && setPlaying(true)}
        onPause={() => !isYt && setPlaying(false)}
        onEnded={() => !isYt && onEnded()}
      />

      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        multiple
        className="hidden"
        onChange={(e) => {
          addFiles(e.target.files);
          e.target.value = "";
        }}
      />

      <div className="relative mx-auto flex max-w-6xl flex-col gap-4 px-4 pb-[calc(10rem+env(safe-area-inset-bottom))] pt-[max(0.75rem,env(safe-area-inset-top))] sm:gap-5 sm:px-6 lg:pb-10 lg:pt-8">
        {/* Header */}
        <header className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <img src="/logo.png" alt="SonicFlow logo" className="h-9 w-9 drop-shadow-md" />
            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">SonicFlow</h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-[118px] sm:w-[200px]">
              <Segmented
                label="Appearance"
                value={theme}
                onChange={changeTheme}
                options={[
                  { value: "system", icon: Icon.auto, title: "Match system" },
                  { value: "light", icon: Icon.sun, title: "Light" },
                  { value: "dark", icon: Icon.moon, title: "Dark" },
                ]}
              />
            </div>
            <div className="relative">
              <button
                onClick={openPicker}
                aria-label="Visual effects"
                title="Visual effects"
                className="tap glass relative flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium"
              >
                <span style={{ color: "var(--accent)" }}><SparkleIcon /></span>
                <span className="hidden sm:inline">Visuals</span>
                {visualTip && <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 animate-ping rounded-full" style={{ background: "var(--accent)" }} />}
              </button>
              {visualTip && (
                <div
                  role="status"
                  className="absolute right-0 top-[calc(100%+12px)] z-30 w-[min(300px,calc(100vw-2rem))] rounded-2xl p-4 shadow-2xl"
                  style={{ background: "var(--card-solid)", border: "1px solid var(--border)" }}
                >
                  <span aria-hidden className="absolute -top-1.5 right-6 h-3 w-3 rotate-45" style={{ background: "var(--card-solid)", borderLeft: "1px solid var(--border)", borderTop: "1px solid var(--border)" }} />
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <span className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white" style={{ background: "var(--accent)" }}>New</span>
                    Visual effects
                  </div>
                  <p className="mt-1.5 text-sm leading-snug" style={{ color: "var(--muted)" }}>
                    Make the background dance to your music. Choose from {VISUALS.length - 1} effects, or watch them full screen.
                  </p>
                  <div className="mt-3 flex justify-end gap-2">
                    <button onClick={dismissVisualTip} className="tap rounded-full px-3 py-1.5 text-sm font-medium" style={{ color: "var(--muted)" }}>
                      Later
                    </button>
                    <button onClick={openPicker} className="tap rounded-full px-3.5 py-1.5 text-sm font-semibold text-white" style={{ background: "var(--accent)" }}>
                      Show me
                    </button>
                  </div>
                </div>
              )}
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="tap flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-medium text-white shadow-md hover:opacity-90"
              style={{ background: "var(--accent)" }}
            >
              <span className="h-4 w-4">{Icon.plus}</span>
              <span className="hidden sm:inline">Add Music</span>
            </button>
          </div>
        </header>

        <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
          {/* Now Playing */}
          <section className={`${show("player")} glass min-w-0 flex-col rounded-[28px] p-5 sm:p-8`}>
            <div className="mx-auto flex w-full min-w-0 max-w-md flex-col items-center">
              {/* Videos get a full-width 16:9 frame (like a video app); songs keep square artwork. */}
              <div
                className={`relative w-full transition-transform duration-500 ${isYt ? "" : "max-w-[min(340px,40svh)]"} ${
                  playing || isYt ? "scale-100" : "scale-[.92]"
                }`}
              >
                <Artwork name={track?.name} image={track?.image} video={isYt} />
                {/* YouTube's embedded player; it must stay visible to comply with YouTube's terms. */}
                <div
                  ref={ytHostRef}
                  className={`absolute inset-0 overflow-hidden rounded-[22px] bg-black shadow-2xl [&_iframe]:h-full [&_iframe]:w-full ${
                    isYt && ytEq === "off" ? "" : "hidden"
                  }`}
                />
                {isYt && ytEq !== "off" && (
                  <div className="absolute inset-x-3 bottom-3 rounded-2xl bg-black/60 px-3 py-2 text-center text-xs font-medium text-white backdrop-blur-md">
                    Video is playing in the SonicFlow · YouTube window
                    {ytEq === "live" ? " · EQ on" : ""}
                  </div>
                )}
              </div>

              <div className="mt-7 w-full min-w-0 text-center">
                <h2
                  className="line-clamp-2 break-words text-xl font-semibold leading-snug tracking-tight sm:text-2xl"
                  title={track?.name}
                >
                  {track?.name || "Not Playing"}
                </h2>
                <p className="mt-1 text-sm" style={muted}>
                  {track
                    ? `${track.artist ? `${track.artist} · ` : ""}${track.ext} · Track ${current + 1} of ${tracks.length}`
                    : "Add songs or paste a YouTube link to get started"}
                </p>
                {!track && (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="tap mt-4 inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-white shadow-md"
                    style={{ background: "var(--accent)" }}
                  >
                    <span className="h-4 w-4">{Icon.plus}</span>
                    Add Music
                  </button>
                )}
              </div>

              {/* Progress */}
              <div className="mt-6 w-full">
                <input
                  type="range"
                  min={0}
                  max={duration || 0}
                  step={0.1}
                  value={Math.min(time, duration || 0)}
                  onChange={seek}
                  disabled={!track}
                  aria-label="Seek"
                  className="slider"
                  style={fillStyle(time, 0, duration || 1)}
                />
                <div className="mt-2 flex justify-between text-xs font-medium tabular-nums" style={muted}>
                  <span>{fmt(time)}</span>
                  <span>-{fmt(Math.max(0, duration - time))}</span>
                </div>
              </div>

              {/* Controls */}
              <div className="mt-4 flex items-center justify-center gap-6 sm:gap-10">
                <button onClick={prev} disabled={!track} aria-label="Previous" className="tap h-12 w-12 rounded-full p-2.5 hover:opacity-70 disabled:opacity-30">
                  {Icon.prev}
                </button>
                <button
                  onClick={togglePlay}
                  disabled={!track}
                  aria-label={playing ? "Pause" : "Play"}
                  className="tap flex h-16 w-16 items-center justify-center rounded-full p-4 shadow-lg disabled:opacity-30"
                  style={{ background: "var(--text)", color: "var(--bg)" }}
                >
                  <span className="block h-full w-full">{playing ? Icon.pause : Icon.play}</span>
                </button>
                <button onClick={next} disabled={!track} aria-label="Next" className="tap h-12 w-12 rounded-full p-2.5 hover:opacity-70 disabled:opacity-30">
                  {Icon.next}
                </button>
              </div>

              {/* Volume */}
              <div className="mt-7 flex w-full items-center gap-3" style={muted}>
                <span className="h-4 w-4 shrink-0">{Icon.volLow}</span>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={volume}
                  onChange={(e) => changeVolume(Number(e.target.value))}
                  aria-label="Volume"
                  className="slider"
                  style={fillStyle(volume, 0, 1)}
                />
                <span className="h-5 w-5 shrink-0">{Icon.volHigh}</span>
              </div>

              {/* Playback speed */}
              <div className="mt-4 flex w-full items-center gap-2">
                <span className="shrink-0 text-xs font-medium" style={muted}>Speed</span>
                <div className="flex min-w-0 flex-1 gap-1 rounded-full p-1" style={{ background: "var(--hover)" }} role="group" aria-label="Playback speed">
                  {SPEEDS.map((r) => (
                    <button
                      key={r}
                      onClick={() => changeSpeed(r)}
                      aria-pressed={speed === r}
                      className="tap flex-1 rounded-full py-1 text-xs font-semibold tabular-nums"
                      style={speed === r ? { background: "var(--text)", color: "var(--bg)" } : muted}
                    >
                      {r}x
                    </button>
                  ))}
                </div>
              </div>

              {/* Visual effects: current effect (live preview) + full screen */}
              <div className="mt-6 flex w-full items-stretch gap-2">
                <button
                  onClick={openPicker}
                  className="tap flex min-w-0 flex-1 items-center gap-3 rounded-2xl p-2 pr-3 text-left"
                  style={{ background: "var(--hover)" }}
                >
                  <div className="relative h-10 w-16 shrink-0 overflow-hidden rounded-xl bg-[#0b0b10]">
                    {visual !== "off" && <Visualizer mode={visual} analyserRef={playing ? analyserRef : NO_AUDIO} playing hue={hue} intense preview />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1 text-xs font-medium" style={muted}>
                      <SparkleIcon className="h-3 w-3" /> Visual effect
                    </div>
                    <div className="truncate text-sm font-semibold">{VISUALS.find((v) => v.id === visual)?.name}</div>
                  </div>
                  <span className="shrink-0 text-xs font-medium" style={{ color: "var(--accent)" }}>Change</span>
                </button>
                <button
                  onClick={enterStage}
                  disabled={!canStage}
                  title={canStage ? "Full screen (F)" : isYt ? "Full screen isn't available while the YouTube video plays on this page" : "Play something first"}
                  aria-label="Full screen visualizer"
                  className="tap flex shrink-0 flex-col items-center justify-center gap-0.5 rounded-2xl px-3 text-[11px] font-medium disabled:opacity-30"
                  style={{ background: "var(--hover)" }}
                >
                  <ExpandIcon className="h-4 w-4" />
                  Full screen
                </button>
              </div>

              {/* Phones: the rest of your music right under the controls, like "Up next" in a video app. */}
              {tracks.length > 1 && (
                <div className="mt-7 w-full lg:hidden">
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="text-base font-semibold tracking-tight">Up next</h3>
                    <button onClick={() => setTab("library")} className="tap text-sm font-medium" style={{ color: "var(--accent)" }}>
                      Library
                    </button>
                  </div>
                  <ul className="-mx-2">
                    {upNext.map((i) => (
                      <li key={tracks[i].id}>{trackRow(i, false)}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </section>

          <div className={`${tab === "player" ? "hidden lg:flex" : "flex"} min-w-0 flex-col gap-5`}>
            {/* Sound / EQ */}
            <section className={`${show("sound")} glass min-w-0 flex-col rounded-[28px] p-5 sm:p-6`}>
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold tracking-tight">Sound</h3>
                <button
                  onClick={() => applyPreset("flat")}
                  disabled={!eqActive || isFlat}
                  className="tap text-sm font-medium disabled:opacity-40"
                  style={{ color: "var(--accent)" }}
                >
                  Reset
                </button>
              </div>

              <div className="mb-6 flex flex-wrap gap-2">
                {PRESETS.map((p) => {
                  const active = activePreset === p.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => applyPreset(p.id)}
                      disabled={!eqActive}
                      aria-pressed={active}
                      className="tap grow basis-[calc(33%-0.5rem)] rounded-full px-3 py-2 text-sm font-medium disabled:opacity-40 lg:basis-auto lg:py-1.5 lg:text-xs"
                      style={{
                        background: active ? "var(--accent)" : "var(--hover)",
                        color: active ? "#fff" : "var(--text)",
                        boxShadow: active ? "0 4px 14px var(--accent-soft)" : "none",
                      }}
                    >
                      {p.label}
                    </button>
                  );
                })}
              </div>

              <div className="mb-5">
                <Segmented
                  label="EQ mode"
                  value={eqMode}
                  onChange={setEqMode}
                  options={[
                    { value: "simple", label: "Bass & Treble" },
                    { value: "bands", label: "10-band" },
                  ]}
                />
              </div>

              {eqMode === "simple" ? (
                <div className="space-y-7 lg:space-y-5">
                  <SimpleSlider
                    label="Bass"
                    hint="32–250 Hz"
                    value={gains[0]}
                    onChange={(v) => setGains(gainsFromSimple(v, gains[BANDS.length - 1]))}
                    disabled={!eqActive}
                  />
                  <SimpleSlider
                    label="Treble"
                    hint="2–16 kHz"
                    value={gains[BANDS.length - 1]}
                    onChange={(v) => setGains(gainsFromSimple(gains[0], v))}
                    disabled={!eqActive}
                  />
                </div>
              ) : (
                <GraphicEq gains={gains} onChange={setGains} disabled={!eqActive} />
              )}

              {/* EQ for YouTube: popup player + tab-audio capture */}
              {(isYt || ytEq !== "off") && (
                <div className="mt-6 rounded-2xl p-4" style={{ background: "var(--hover)" }}>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-semibold">EQ for YouTube</span>
                    {ytEq !== "off" && (
                      <button onClick={closeYtEq} className="tap text-xs font-medium" style={{ color: "var(--accent)" }}>
                        Turn off
                      </button>
                    )}
                  </div>
                  {ytEq === "off" && !tabAudioOk && (
                    <p className="mt-1 text-xs leading-relaxed" style={muted}>
                      This browser can&apos;t share a tab&apos;s audio, so the EQ can&apos;t reach YouTube here. Open SonicFlow in <b>Chrome</b> or{" "}
                      <b>Edge</b> on a computer to use it.
                    </p>
                  )}
                  {ytEq === "off" && tabAudioOk && (
                    <>
                      <p className="mt-1 text-xs leading-relaxed" style={muted}>
                        Moves the video into a small SonicFlow window, then you share that window&apos;s audio so the EQ can process it. Works in
                        Chrome and Edge on a computer.
                      </p>
                      <button
                        onClick={openYtEqPlayer}
                        className="tap mt-3 w-full rounded-xl py-2.5 text-sm font-semibold text-white"
                        style={{ background: "var(--accent)" }}
                      >
                        1. Open EQ player window
                      </button>
                    </>
                  )}
                  {ytEq === "popup" && (
                    <>
                      <p className="mt-1 text-xs leading-relaxed" style={muted}>
                        In the share dialog pick the <b>SonicFlow · YouTube</b> tab and keep <b>Share tab audio</b> on. If the video doesn&apos;t start, press
                        play in that window once.
                      </p>
                      <button
                        onClick={shareYtAudio}
                        className="tap mt-3 w-full rounded-xl py-2.5 text-sm font-semibold text-white"
                        style={{ background: "var(--accent)" }}
                      >
                        2. Share its audio
                      </button>
                    </>
                  )}
                  {ytEq === "live" && (
                    <p className="mt-1 text-xs leading-relaxed" style={muted}>
                      EQ is live on YouTube. Keep the SonicFlow · YouTube window open; &quot;Stop sharing&quot; in your browser switches the EQ off.
                    </p>
                  )}
                </div>
              )}

              <button
                onClick={exportTrack}
                disabled={!track || isYt || exporting}
                className="tap mt-7 flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-[15px] font-semibold disabled:opacity-40 lg:py-3 lg:text-sm"
                style={{ background: "var(--accent-soft)", color: "var(--accent)" }}
              >
                {exporting ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    {exportStage.stage === "eq" ? "Applying EQ…" : `Creating MP3… ${Math.round(exportStage.p * 100)}%`}
                  </>
                ) : (
                  <>
                    <span className="h-4 w-4">{Icon.download}</span>
                    Download MP3 with EQ
                  </>
                )}
              </button>
              {exporting && (
                <div className="mt-3 h-1 overflow-hidden rounded-full" style={{ background: "var(--track)" }}>
                  <div
                    className="h-full rounded-full transition-[width] duration-200"
                    style={{ background: "var(--accent)", width: `${exportStage.stage === "eq" ? 5 : 5 + exportStage.p * 95}%` }}
                  />
                </div>
              )}
              <p className="mt-2 text-center text-[11px]" style={muted}>
                {isYt
                  ? "Download works on your own audio files only."
                  : "320 kbps MP3 with your EQ applied, ready to copy to a USB drive for your speaker."}
              </p>
            </section>

            {/* Library */}
            <section className={`${show("library")} glass min-h-0 min-w-0 flex-col rounded-[28px] p-5 sm:p-6`}>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-lg font-semibold tracking-tight">Library</h3>
                <span className="text-sm" style={muted}>
                  {tracks.length} {tracks.length === 1 ? "song" : "songs"}
                </span>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (addYouTube(ytUrl)) setYtUrl("");
                }}
                className="mb-4 flex gap-2"
              >
                <input
                  type="text"
                  inputMode="url"
                  autoComplete="off"
                  spellCheck={false}
                  value={ytUrl}
                  onChange={(e) => setYtUrl(e.target.value)}
                  placeholder="Paste a YouTube link"
                  aria-label="YouTube link"
                  className="min-w-0 flex-1 rounded-full px-4 py-2.5 text-base outline-none focus:ring-2 sm:text-sm"
                  style={{ background: "var(--hover)", color: "var(--text)", "--tw-ring-color": "var(--accent)" }}
                />
                <button
                  type="submit"
                  disabled={!ytUrl.trim()}
                  className="tap shrink-0 rounded-full px-4 text-sm font-semibold text-white disabled:opacity-40"
                  style={{ background: "var(--accent)" }}
                >
                  Play
                </button>
              </form>

              {tracks.length === 0 ? (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="tap flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-4 py-10 text-sm"
                  style={{ borderColor: "var(--track)", color: "var(--muted)" }}
                >
                  <span className="h-7 w-7" style={{ color: "var(--accent)" }}>
                    {Icon.plus}
                  </span>
                  <span className="font-medium" style={{ color: "var(--text)" }}>
                    Add MP3 or audio files
                  </span>
                  <span>or drag &amp; drop them anywhere</span>
                </button>
              ) : (
                <ul className="scroll-thin -mx-2 lg:max-h-[340px] lg:overflow-y-auto">
                  {tracks.map((t, i) => (
                    <li key={t.id} className="group">
                      {trackRow(i, true)}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </div>
      </div>

      {/* Mobile: mini-player + bottom tab bar */}
      {pickerOpen && (
        <VisualPicker
          value={visual}
          onChange={changeVisual}
          onClose={() => setPickerOpen(false)}
          onFullscreen={enterStage}
          canFullscreen={canStage}
          analyserRef={analyserRef}
          playing={playing}
          hue={hue}
          onStage={stage}
        />
      )}

      {stage && (
        <div className={`fixed inset-0 z-50 overflow-hidden bg-black text-white ${stageUi || pickerOpen ? "" : "cursor-none"}`}>
          {track?.image && (
            <div className="absolute inset-[-10%] bg-cover bg-center opacity-25 blur-[90px] saturate-150" style={{ backgroundImage: `url("${track.image}")` }} />
          )}
          <div className="absolute inset-0">
            <Visualizer mode={visual} analyserRef={analyserRef} playing={playing} hue={hue} intense />
          </div>

          {/* Top bar: effect switcher + close (fades when idle) */}
          <div
            className={`absolute inset-x-0 top-0 flex items-center justify-between gap-3 bg-gradient-to-b from-black/50 to-transparent p-3 pt-[max(0.75rem,env(safe-area-inset-top))] transition-opacity duration-500 sm:p-6 ${
              stageUi ? "opacity-100" : "pointer-events-none opacity-0"
            }`}
          >
            <button
              onClick={() => setPickerOpen(true)}
              className="tap flex min-w-0 items-center gap-2 rounded-full bg-white/15 py-2 pl-3 pr-4 text-sm font-medium backdrop-blur-md hover:bg-white/25"
            >
              <SparkleIcon />
              <span className="truncate">
                {CATEGORIES.find((c) => c.id === VISUALS.find((v) => v.id === visual)?.cat)?.emoji} {VISUALS.find((v) => v.id === visual)?.name}
              </span>
              <span className="text-white/60">· Change</span>
            </button>
            <button onClick={exitStage} aria-label="Exit full screen" className="tap flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/15 backdrop-blur-md hover:bg-white/25">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-5 w-5">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>

          {/* Bottom: compact now-playing (always visible) + controls (fade when idle) */}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-16 sm:px-8 sm:pb-8">
            <div className="mx-auto max-w-2xl">
              <div className="flex items-center gap-3">
                <div className="shrink-0">
                  <Artwork name={track?.name} image={track?.image} size="thumb" playing={playing} />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="line-clamp-1 text-base font-semibold drop-shadow sm:text-xl">{track?.name}</h2>
                  <p className="line-clamp-1 text-xs text-white/60 sm:text-sm">{track?.artist || `${track?.ext || ""} · Track ${current + 1} of ${tracks.length}`}</p>
                </div>
              </div>
              <div className={`transition-all duration-500 ${stageUi ? "mt-4 max-h-60 opacity-100" : "pointer-events-none mt-0 max-h-0 opacity-0"}`}>
                <input
                  type="range"
                  min={0}
                  max={duration || 0}
                  step={0.1}
                  value={Math.min(time, duration || 0)}
                  onChange={seek}
                  aria-label="Seek"
                  className="slider"
                  style={{ ...fillStyle(time, 0, duration || 1), "--track": "rgba(255,255,255,.2)", "--fill-color": "#fff" }}
                />
                <div className="mt-1.5 flex justify-between text-[11px] tabular-nums text-white/60">
                  <span>{fmt(time)}</span>
                  <span>-{fmt(Math.max(0, duration - time))}</span>
                </div>
                <div className="mt-2 flex items-center justify-center gap-8">
                  <button onClick={prev} aria-label="Previous" className="tap h-10 w-10 p-2 hover:opacity-70">{Icon.prev}</button>
                  <button onClick={togglePlay} aria-label={playing ? "Pause" : "Play"} className="tap flex h-14 w-14 items-center justify-center rounded-full bg-white p-3.5 text-black shadow-xl">
                    <span className="block h-full w-full">{playing ? Icon.pause : Icon.play}</span>
                  </button>
                  <button onClick={next} aria-label="Next" className="tap h-10 w-10 p-2 hover:opacity-70">{Icon.next}</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <nav className="fixed inset-x-0 bottom-0 z-30 px-3 pb-[max(0.5rem,env(safe-area-inset-bottom))] lg:hidden">
        {track && tab !== "player" && (
          <div className="glass mb-2 flex items-center gap-3 rounded-2xl p-2 pr-3">
            <button onClick={() => setTab("player")} className="flex min-w-0 flex-1 items-center gap-3 text-left" aria-label="Open Now Playing">
              <Artwork name={track.name} image={track.image} size="sm" playing={playing} />
              <span className="truncate text-sm font-medium">{track.name}</span>
            </button>
            <button onClick={togglePlay} aria-label={playing ? "Pause" : "Play"} className="tap h-10 w-10 shrink-0 rounded-full p-2.5">
              {playing ? Icon.pause : Icon.play}
            </button>
            <button onClick={next} aria-label="Next" className="tap h-10 w-10 shrink-0 rounded-full p-2.5">
              {Icon.next}
            </button>
          </div>
        )}
        <div className="glass flex rounded-[22px] p-1.5">
          {[
            { id: "player", label: "Now Playing", icon: Icon.tabPlayer },
            { id: "sound", label: "Sound", icon: Icon.tabSound },
            { id: "library", label: "Library", icon: Icon.tabLibrary },
          ].map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => {
                  setTab(t.id);
                  window.scrollTo({ top: 0 });
                }}
                aria-current={active ? "page" : undefined}
                className="tap flex flex-1 flex-col items-center gap-1 rounded-2xl py-2 text-[11px] font-medium"
                style={{ color: active ? "var(--accent)" : "var(--muted)", background: active ? "var(--hover)" : "transparent" }}
              >
                <span className="h-6 w-6">{t.icon}</span>
                {t.label}
                {t.id === "library" && tracks.length > 0 && <span className="sr-only">({tracks.length})</span>}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Drag overlay */}
      {dragging && (
        <div className="pointer-events-none fixed inset-0 z-40 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="glass rounded-3xl px-8 py-6 text-lg font-semibold">Drop to add songs</div>
        </div>
      )}

      {/* Toast */}
      <div
        className={`glass fixed bottom-[calc(9.5rem+env(safe-area-inset-bottom))] left-1/2 z-50 whitespace-nowrap lg:bottom-5 -translate-x-1/2 rounded-full px-5 py-2.5 text-sm font-medium transition-all duration-300 ${
          toast ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"
        }`}
        role="status"
      >
        {toast}
      </div>
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";

/* ---------- constants ---------- */

const BASS_FREQ = 200;
const TREBLE_FREQ = 3000;
const EQ_MIN = -15;
const EQ_MAX = 15;
const EQ_KEY = "sonicflow-eq";
const THEME_KEY = "sonicflow-theme";

const PRESETS = [
  { id: "flat", label: "Flat", bass: 0, treble: 0 },
  { id: "bass", label: "Bass Boost", bass: 8, treble: 0 },
  { id: "treble", label: "Treble Boost", bass: 0, treble: 7 },
  { id: "vocal", label: "Vocal", bass: -3, treble: 4 },
  { id: "loud", label: "Loudness", bass: 6, treble: 5 },
];

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

function makeFilters(ctx, bass, treble) {
  const b = ctx.createBiquadFilter();
  b.type = "lowshelf";
  b.frequency.value = BASS_FREQ;
  b.gain.value = bass;
  const t = ctx.createBiquadFilter();
  t.type = "highshelf";
  t.frequency.value = TREBLE_FREQ;
  t.gain.value = treble;
  b.connect(t);
  return [b, t];
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

async function renderWithEq(file, bass, treble, onStage) {
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
  const [b, t] = makeFilters(offline, bass, treble);
  src.connect(b);
  t.connect(offline.destination);
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

let ytApiPromise = null;
function loadYouTubeApi() {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (!ytApiPromise) {
    ytApiPromise = new Promise((resolve, reject) => {
      const prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        prev?.();
        resolve(window.YT);
      };
      const s = document.createElement("script");
      s.src = "https://www.youtube.com/iframe_api";
      s.onerror = () => {
        ytApiPromise = null;
        reject(new Error("Couldn't load YouTube"));
      };
      document.head.appendChild(s);
    });
  }
  return ytApiPromise;
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

function Artwork({ name, image, size = "full", playing }) {
  const h = hueFor(name);
  return (
    <div
      className={`relative flex aspect-square items-center justify-center overflow-hidden ${
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

function EqSlider({ label, hint, value, onChange }) {
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between">
        <div>
          <span className="text-sm font-medium">{label}</span>
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

/* ---------- main ---------- */

export default function MusicPlayer() {
  const audioRef = useRef(null);
  const ctxRef = useRef(null);
  const bassRef = useRef(null);
  const trebleRef = useRef(null);
  const fileInputRef = useRef(null);
  const pendingPlay = useRef(false);
  const ytHostRef = useRef(null);
  const ytRef = useRef(null); // ready YT.Player instance
  const ytPromiseRef = useRef(null);
  const ytLoadedId = useRef(null); // videoId currently loaded in the player
  const ytEvents = useRef({});

  const [tracks, setTracks] = useState([]);
  const [ytUrl, setYtUrl] = useState("");
  const [current, setCurrent] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [bass, setBass] = useState(0);
  const [treble, setTreble] = useState(0);
  const [theme, setTheme] = useState("system");
  const [exporting, setExporting] = useState(false);
  const [exportStage, setExportStage] = useState({ stage: "eq", p: 0 });
  const [toast, setToast] = useState("");
  const [dragging, setDragging] = useState(false);
  // Mobile tabs; on large screens every panel is visible at once.
  const [tab, setTab] = useState("player");
  const show = (name) => (tab === name ? "flex" : "hidden lg:flex");

  const track = tracks[current];
  const isYt = track?.kind === "youtube";
  const hue = hueFor(track?.name);

  /* --- load saved settings --- */
  useEffect(() => {
    try {
      const eq = JSON.parse(localStorage.getItem(EQ_KEY) || "null");
      if (eq) {
        setBass(Number(eq.bass) || 0);
        setTreble(Number(eq.treble) || 0);
      }
      const t = localStorage.getItem(THEME_KEY);
      if (t === "light" || t === "dark") setTheme(t);
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(EQ_KEY, JSON.stringify({ bass, treble }));
    } catch {}
  }, [bass, treble]);

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
    const [b, t] = makeFilters(ctx, bass, treble);
    source.connect(b);
    t.connect(ctx.destination);
    ctxRef.current = ctx;
    bassRef.current = b;
    trebleRef.current = t;
  };

  // Smoothly apply EQ changes to the live filters.
  useEffect(() => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    bassRef.current.gain.setTargetAtTime(bass, ctx.currentTime, 0.03);
    trebleRef.current.gain.setTargetAtTime(treble, ctx.currentTime, 0.03);
  }, [bass, treble]);

  /* --- YouTube player (official embed, created on first use) --- */
  const getYT = () => {
    if (!ytPromiseRef.current) {
      ytPromiseRef.current = loadYouTubeApi()
        .then(
          (YT) =>
            new Promise((resolve) => {
              // YT replaces this element with an iframe, so keep it outside React's tree.
              const el = document.createElement("div");
              ytHostRef.current.appendChild(el);
              const p = new YT.Player(el, {
                width: "100%",
                height: "100%",
                playerVars: { playsinline: 1, controls: 0, rel: 0, disablekb: 1, iv_load_policy: 3 },
                events: {
                  onReady: () => {
                    ytRef.current = p;
                    p.setVolume(Math.round(ytEvents.current.volume * 100));
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

  // Events from the YouTube player, routed through a ref so they always see fresh state.
  ytEvents.current = {
    volume,
    onState: (state, p) => {
      if (!isYt) return;
      if (state === 1) {
        setPlaying(true);
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
      if (e.target.closest?.("input, textarea, button")) return;
      const a = actionsRef.current;
      if (e.code === "Space") {
        e.preventDefault();
        a.togglePlay();
      } else if (e.code === "ArrowRight") a.seekBy(5);
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
  actionsRef.current = { togglePlay, next, prev, seekTo, addYouTube, seekBy: (d) => seekTo(time + d) };
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
    if (!p) return;
    setBass(p.bass);
    setTreble(p.treble);
  };
  const activePreset = PRESETS.find((p) => p.bass === bass && p.treble === treble)?.id;

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
      const blob = await renderWithEq(track.file, bass, treble, (stage, p) => setExportStage({ stage, p }));
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const tag = `B${bass >= 0 ? "+" : ""}${bass} T${treble >= 0 ? "+" : ""}${treble}`;
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

  return (
    <div className="relative min-h-[100dvh] overflow-hidden" {...dropHandlers}>
      {/* Ambient background tinted by the current artwork */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 transition-[background] duration-1000"
        style={{
          background: track
            ? `radial-gradient(60% 50% at 20% 10%, hsl(${hue} 80% 55% / .35), transparent 70%),
               radial-gradient(50% 50% at 85% 80%, hsl(${(hue + 80) % 360} 70% 50% / .28), transparent 70%)`
            : "radial-gradient(60% 50% at 50% 0%, var(--accent-soft), transparent 70%)",
        }}
      />

      <audio
        ref={audioRef}
        src={track?.url}
        onTimeUpdate={(e) => !isYt && setTime(e.target.currentTime)}
        onLoadedMetadata={(e) => !isYt && setDuration(e.target.duration)}
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
              <div className={`relative w-full max-w-[min(340px,40svh)] transition-transform duration-500 ${playing ? "scale-100" : "scale-[.92]"}`}>
                <Artwork name={track?.name} image={track?.image} />
                {/* YouTube's embedded player; it must stay visible to comply with YouTube's terms. */}
                <div
                  ref={ytHostRef}
                  className={`absolute inset-0 overflow-hidden rounded-[22px] bg-black shadow-2xl [&_iframe]:h-full [&_iframe]:w-full ${
                    isYt ? "" : "hidden"
                  }`}
                />
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
            </div>
          </section>

          <div className={`${tab === "player" ? "hidden lg:flex" : "flex"} min-w-0 flex-col gap-5`}>
            {/* Sound / EQ */}
            <section className={`${show("sound")} glass min-w-0 flex-col rounded-[28px] p-5 sm:p-6`}>
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold tracking-tight">Sound</h3>
                <button
                  onClick={() => applyPreset("flat")}
                  disabled={!bass && !treble}
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
                      aria-pressed={active}
                      className="tap grow basis-[calc(33%-0.5rem)] rounded-full px-3 py-2 text-sm font-medium lg:basis-auto lg:py-1.5 lg:text-xs"
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

              <div className="space-y-7 lg:space-y-5">
                <EqSlider label="Bass" hint={`${BASS_FREQ} Hz`} value={bass} onChange={setBass} />
                <EqSlider label="Treble" hint={`${TREBLE_FREQ / 1000} kHz`} value={treble} onChange={setTreble} />
              </div>

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
                  ? "Bass, treble and download work on your own audio files. YouTube plays in its own protected player, so the EQ can't reach it."
                  : "320 kbps MP3 with your bass & treble applied, ready to copy to a USB drive for your speaker."}
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
                  {tracks.map((t, i) => {
                    const active = i === current;
                    return (
                      <li key={t.id} className="group">
                        <div
                          className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition-colors"
                          style={{ background: active ? "var(--hover)" : "transparent" }}
                        >
                          <button onClick={() => playIndex(i)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                            <Artwork name={t.name} image={t.image} size="sm" playing={active && playing} />
                            <div className="min-w-0 flex-1">
                              <div className="truncate text-sm font-medium" style={{ color: active ? "var(--accent)" : "var(--text)" }}>
                                {t.name}
                              </div>
                              <div className="text-xs" style={muted}>
                                {t.ext}
                              </div>
                            </div>
                          </button>
                          <button
                            onClick={() => removeTrack(i)}
                            aria-label={`Remove ${t.name}`}
                            className="tap rounded-full px-3 py-2 text-xl leading-none opacity-60 hover:opacity-100 lg:px-2 lg:py-1 lg:text-lg lg:opacity-0 lg:group-hover:opacity-60"
                            style={muted}
                          >
                            ×
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          </div>
        </div>
      </div>

      {/* Mobile: mini-player + bottom tab bar */}
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

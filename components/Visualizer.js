"use client";

import { useEffect, useRef } from "react";

/* Animated, music-reactive backgrounds drawn on a canvas.
   With a Web Audio analyser they follow the real spectrum; without one (e.g. a plain
   YouTube embed, whose audio the page can't read) they dance to a synthetic beat. */

export const CATEGORIES = [
  { id: "all", name: "All", emoji: "✨" },
  { id: "chill", name: "Chill", emoji: "🌊" },
  { id: "focus", name: "Focus", emoji: "🎧" },
  { id: "nature", name: "Nature", emoji: "🌿" },
  { id: "party", name: "Party & Dance", emoji: "🎉" },
  { id: "kids", name: "Kids", emoji: "🎈" },
  { id: "sleep", name: "Baby Sleep", emoji: "🌙" },
  { id: "meal", name: "Baby Mealtime", emoji: "🍼" },
  { id: "celebrate", name: "Celebrate", emoji: "🎆" },
  { id: "club", name: "Club", emoji: "🪩" },
  { id: "arcade", name: "Retro Arcade", emoji: "👾" },
  { id: "romance", name: "Romance", emoji: "💖" },
  { id: "camera", name: "Camera", emoji: "📷" },
];

export const VISUALS = [
  // Chill
  { id: "aurora", cat: "chill", name: "Aurora", desc: "Soft glowing colours that swell with the bass" },
  { id: "waves", cat: "chill", name: "Waves", desc: "Layers of flowing waves" },
  { id: "galaxy", cat: "chill", name: "Galaxy", desc: "A swirling spiral of light" },
  { id: "constellation", cat: "chill", name: "Constellation", desc: "Drifting stars linked by light" },
  { id: "bubbles", cat: "chill", name: "Bubbles", desc: "Bubbles that rise and bounce" },
  { id: "ribbons", cat: "chill", name: "Silk", desc: "Silky ribbons of light ripple with the music" },
  { id: "sunset", cat: "chill", name: "Sunset", desc: "A sun sinks into a shimmering sea" },
  // Focus
  { id: "lava", cat: "focus", name: "Lava Lamp", desc: "Slow blobs of colour rise and fall" },
  { id: "ripples", cat: "focus", name: "Zen Ripples", desc: "Calm ripples spread across a still pond" },
  { id: "orbits", cat: "focus", name: "Orbits", desc: "Planets gently circle a glowing sun" },
  // Nature: slow and peaceful
  { id: "forest", cat: "nature", name: "Forest", desc: "Misty pine forest with sunbeams through the trees" },
  { id: "blossom", cat: "nature", name: "Blossom Tree", desc: "A swaying cherry tree dropping pink petals" },
  { id: "leaves", cat: "nature", name: "Autumn Leaves", desc: "Golden leaves tumble slowly to the ground" },
  { id: "meadow", cat: "nature", name: "Meadow", desc: "Tall grass and flowers waving in the breeze" },
  { id: "mountains", cat: "nature", name: "Mountains", desc: "Dawn over the peaks with birds gliding by" },
  { id: "ocean", cat: "nature", name: "Ocean", desc: "Moonlit waves rolling in slowly" },
  { id: "rain", cat: "nature", name: "Rain", desc: "Gentle rainfall with soft splashes" },
  { id: "snow", cat: "nature", name: "Snowfall", desc: "Snowflakes drifting down slowly" },
  { id: "campfire", cat: "nature", name: "Campfire", desc: "A calm fire with floating sparks" },
  // Party & Dance
  { id: "confetti", cat: "party", name: "Confetti", desc: "Confetti cannons fire on the beat" },
  { id: "disco", cat: "party", name: "Disco Ball", desc: "A spinning mirror ball throws coloured lights" },
  { id: "bars", cat: "party", name: "Spectrum", desc: "Classic equalizer bars" },
  { id: "pulse", cat: "party", name: "Pulse", desc: "Rings burst out on each beat" },
  { id: "ring", cat: "party", name: "Halo", desc: "A spinning ring of sound" },
  { id: "kaleido", cat: "party", name: "Kaleidoscope", desc: "Mirrored shapes bloom to the beat" },
  { id: "spotlights", cat: "party", name: "Dance Floor", desc: "Stage lights sweep over a jumping crowd" },
  // Celebrate
  { id: "fireworks", cat: "celebrate", name: "Fireworks", desc: "Rockets burst into colour on the beat" },
  { id: "sparkle", cat: "celebrate", name: "Glitter", desc: "Twinkling sparkles and bursts of glitter" },
  { id: "lanterns", cat: "celebrate", name: "Sky Lanterns", desc: "Glowing lanterns float into the night" },
  // Club
  { id: "lasers", cat: "club", name: "Lasers", desc: "Sweeping neon laser beams" },
  { id: "tunnel", cat: "club", name: "Neon Tunnel", desc: "Rush through a tunnel of neon" },
  { id: "retro", cat: "club", name: "Retro", desc: "Synthwave sun and neon grid" },
  { id: "particles", cat: "club", name: "Starfield", desc: "Fly through stars on every beat" },
  { id: "scope", cat: "club", name: "Scope", desc: "A glowing live sound wave" },
  { id: "ledwall", cat: "club", name: "LED Wall", desc: "A wall of LEDs lights up with the sound" },
  { id: "vortex", cat: "club", name: "Vortex", desc: "A hypnotic spiral pulling you in" },
  // Retro arcade
  { id: "matrix", cat: "arcade", name: "Code Rain", desc: "Streams of glowing characters" },
  { id: "pixel", cat: "arcade", name: "8-bit EQ", desc: "Chunky pixel equalizer with peak markers" },
  { id: "plasma", cat: "arcade", name: "Plasma", desc: "Old-school demo-scene colour plasma" },
  // Romance
  { id: "hearts", cat: "romance", name: "Hearts", desc: "Floating hearts around a beating heart" },
  { id: "petals", cat: "romance", name: "Rose Petals", desc: "Petals tumble softly through the air" },
  { id: "candles", cat: "romance", name: "Candlelight", desc: "Flickering candles and warm bokeh" },
  // Kids
  { id: "balloons", cat: "kids", name: "Balloons", desc: "Colourful balloons float up and bounce" },
  { id: "rainbow", cat: "kids", name: "Rainbow", desc: "A happy rainbow with drifting clouds" },
  { id: "shapes", cat: "kids", name: "Happy Shapes", desc: "Stars, hearts and circles dance along" },
  { id: "aquarium", cat: "kids", name: "Aquarium", desc: "Friendly fish swim among the seaweed" },
  { id: "butterflies", cat: "kids", name: "Butterflies", desc: "Butterflies flutter over dancing flowers" },
  { id: "space", cat: "kids", name: "Space Trip", desc: "A little rocket zooms past planets and stars" },
  { id: "hotair", cat: "kids", name: "Hot Air Balloons", desc: "Striped balloons float through a pastel sky" },
  { id: "kites", cat: "kids", name: "Kites", desc: "Colourful kites dance in the wind" },
  // Baby sleep: slow and dim on purpose, they barely react to the beat
  { id: "nightsky", cat: "sleep", name: "Night Sky", desc: "A calm moon and softly twinkling stars" },
  { id: "nightlight", cat: "sleep", name: "Night Light", desc: "A gentle glow that slowly breathes" },
  { id: "fireflies", cat: "sleep", name: "Fireflies", desc: "Sleepy fireflies blinking in the dark" },
  { id: "mobile", cat: "sleep", name: "Crib Mobile", desc: "A moon and stars turning slowly overhead" },
  { id: "clouds", cat: "sleep", name: "Sleepy Clouds", desc: "Soft clouds drifting across a dusk sky" },
  { id: "sheep", cat: "sleep", name: "Counting Sheep", desc: "Fluffy sheep hop the fence, one by one" },
  { id: "sleepymoon", cat: "sleep", name: "Sleepy Moon", desc: "A dozing moon in a nightcap, softly rocking" },
  { id: "jellyfish", cat: "sleep", name: "Jellyfish", desc: "Glowing jellyfish drifting in the deep" },
  { id: "projector", cat: "sleep", name: "Star Projector", desc: "Soft stars and hearts turning on the ceiling" },
  // Baby mealtime: happy cartoon friends to watch while eating
  { id: "spoonplane", cat: "meal", name: "Airplane Spoon", desc: "Here comes the airplane, loop-de-loop!" },
  { id: "animals", cat: "meal", name: "Animal Choir", desc: "Bear, bunny, kitty, panda and chick sing along" },
  { id: "fruits", cat: "meal", name: "Dancing Fruits", desc: "Happy fruits hop on the picnic blanket" },
  { id: "train", cat: "meal", name: "Choo-Choo Train", desc: "Animal friends ride a little train" },
  { id: "duckies", cat: "meal", name: "Rubber Duckies", desc: "Ducks bobbing on the waves" },
  { id: "peekaboo", cat: "meal", name: "Peekaboo", desc: "Animals pop up from behind the bushes" },
  // Camera: your webcam, remixed to the music
  { id: "cammirror", cat: "camera", name: "Mirror Cam", desc: "You on screen, with a glow and bars that pulse" },
  { id: "camcolor", cat: "camera", name: "Colour Cam", desc: "Wild colours that shift with the beat" },
  { id: "campop", cat: "camera", name: "Pop Art", desc: "Four colourful copies of you, swapping on the beat" },
  { id: "campixel", cat: "camera", name: "Pixel Cam", desc: "Retro pixels that get chunkier with the bass" },
  { id: "camkaleido", cat: "camera", name: "Kaleido Cam", desc: "You, mirrored into a kaleidoscope" },
  { id: "camecho", cat: "camera", name: "Echo Cam", desc: "Dreamy motion trails follow every move" },
  { id: "off", cat: null, name: "Off", desc: "No animation" },
];

const KIDS = [0, 30, 50, 120, 195, 270, 320]; // bright, friendly hues
const CAMERA = new Set(VISUALS.filter((v) => v.cat === "camera").map((v) => v.id));
// Effects with solid shapes look washed out with additive blending.
const SOLID = new Set([
  "balloons", "rainbow", "shapes", "confetti", "nightsky", "sunset", "aquarium", "butterflies",
  "mobile", "clouds", "petals", "candles", "lanterns", "plasma",
  "forest", "blossom", "leaves", "meadow", "mountains", "ocean",
  "space", "hotair", "kites", "sheep", "sleepymoon", "jellyfish", "projector",
  "spoonplane", "animals", "fruits", "train", "duckies", "peekaboo",
  ...CAMERA,
]);

/* ---------- Cartoon helpers (kids, sleep and mealtime scenes) ---------- */
const INK = "#2a2230";
const ANIMALS = ["bear", "bunny", "cat", "panda", "chick"];
const blinkAt = (ts, seed) => ((ts + seed * 2.7) % 4 < 0.14 ? 1 : 0);
function circ(ctx, x, y, r, fill) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.arc(x, y, Math.max(0.1, r), 0, Math.PI * 2);
  ctx.fill();
}
function ell(ctx, x, y, rx, ry, rot, fill) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), rot, 0, Math.PI * 2);
  ctx.fill();
}
function cloud(ctx, x, y, r) {
  ctx.beginPath();
  for (const [dx, dy, rr] of [[-1.1, 0.2, 0.7], [-0.4, -0.3, 1], [0.5, -0.1, 0.85], [1.2, 0.25, 0.65], [0, 0.35, 0.8]]) {
    ctx.moveTo(x + dx * r + rr * r, y + dy * r);
    ctx.arc(x + dx * r, y + dy * r, rr * r, 0, Math.PI * 2);
  }
  ctx.fill();
}
function star5(ctx, x, y, r) {
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2 - Math.PI / 2, rr = i % 2 ? r * 0.45 : r;
    ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  ctx.closePath();
}
// Cute face: dot eyes (or closed "u" eyes when blinking/asleep), rosy cheeks, smile or open mouth.
function face(ctx, x, y, r, blink = 0, open = 0, sleepy = false) {
  const ey = y - r * 0.1, ex = r * 0.32, er = r * 0.11;
  ctx.lineWidth = Math.max(1.2, r * 0.06);
  ctx.strokeStyle = INK;
  for (const s of [-1, 1]) {
    if (sleepy || blink) {
      ctx.beginPath();
      ctx.arc(x + s * ex, ey - er * 0.4, er, 0.15 * Math.PI, 0.85 * Math.PI);
      ctx.stroke();
    } else {
      circ(ctx, x + s * ex, ey, er, INK);
      circ(ctx, x + s * ex + er * 0.35, ey - er * 0.35, er * 0.38, "#fff");
    }
  }
  for (const s of [-1, 1]) ell(ctx, x + s * r * 0.52, y + r * 0.14, r * 0.13, r * 0.08, 0, "rgba(255,110,140,0.45)");
  if (open > 0.08) ell(ctx, x, y + r * 0.27, r * 0.12, r * 0.14 * Math.min(1, open) + 1, 0, "#b8354f");
  else {
    ctx.beginPath();
    ctx.arc(x, y + r * 0.1, r * 0.17, 0.2 * Math.PI, 0.8 * Math.PI);
    ctx.stroke();
  }
}
function animal(ctx, kind, x, y, r, blink = 0, open = 0, sleepy = false) {
  if (kind === "bear") {
    for (const s of [-1, 1]) {
      circ(ctx, x + s * r * 0.68, y - r * 0.68, r * 0.32, "#a8703f");
      circ(ctx, x + s * r * 0.68, y - r * 0.68, r * 0.17, "#e2b98f");
    }
    circ(ctx, x, y, r, "#b9804c");
    ell(ctx, x, y + r * 0.28, r * 0.4, r * 0.3, 0, "#ecd0ae");
    face(ctx, x, y, r, blink, open, sleepy);
    ell(ctx, x, y + r * 0.06, r * 0.1, r * 0.07, 0, "#3a2a22");
  } else if (kind === "bunny") {
    for (const s of [-1, 1]) {
      ell(ctx, x + s * r * 0.38, y - r * 1.05, r * 0.22, r * 0.6, s * 0.15, "#f6f1f6");
      ell(ctx, x + s * r * 0.38, y - r * 1.02, r * 0.11, r * 0.42, s * 0.15, "#ffc2d6");
    }
    circ(ctx, x, y, r, "#f6f1f6");
    face(ctx, x, y, r, blink, open, sleepy);
    ell(ctx, x, y + r * 0.06, r * 0.08, r * 0.06, 0, "#ff8fb1");
  } else if (kind === "cat") {
    ctx.fillStyle = "#e88c35";
    ctx.beginPath();
    for (const s of [-1, 1]) {
      ctx.moveTo(x + s * r * 0.92, y - r * 0.2);
      ctx.lineTo(x + s * r * 0.78, y - r * 1.08);
      ctx.lineTo(x + s * r * 0.22, y - r * 0.82);
    }
    ctx.fill();
    circ(ctx, x, y, r, "#f5a552");
    face(ctx, x, y, r, blink, open, sleepy);
    ctx.strokeStyle = INK;
    ctx.lineWidth = Math.max(1, r * 0.03);
    ctx.beginPath();
    for (const s of [-1, 1])
      for (const dy of [0.02, 0.18]) {
        ctx.moveTo(x + s * r * 0.4, y + r * 0.12);
        ctx.lineTo(x + s * r * 0.95, y + r * dy);
      }
    ctx.stroke();
    ell(ctx, x, y + r * 0.06, r * 0.08, r * 0.06, 0, "#ff8fb1");
  } else if (kind === "panda") {
    for (const s of [-1, 1]) circ(ctx, x + s * r * 0.7, y - r * 0.7, r * 0.3, "#2b2b33");
    circ(ctx, x, y, r, "#fafafa");
    for (const s of [-1, 1]) ell(ctx, x + s * r * 0.33, y - r * 0.08, r * 0.2, r * 0.26, -s * 0.5, "#2b2b33");
    face(ctx, x, y, r, blink, open, sleepy);
    ell(ctx, x, y + r * 0.06, r * 0.1, r * 0.07, 0, "#2b2b33");
  } else {
    // chick
    for (const a of [-0.4, 0, 0.4]) ell(ctx, x + a * r * 0.4, y - r * 1.02, r * 0.1, r * 0.22, a, "#ffc928");
    circ(ctx, x, y, r, "#ffd93b");
    face(ctx, x, y, r, blink, 0, sleepy);
    const o = Math.min(1, open) * r * 0.12;
    ctx.fillStyle = "#ff9a2e";
    ctx.beginPath();
    ctx.moveTo(x - r * 0.15, y + r * 0.12 - o / 2);
    ctx.lineTo(x + r * 0.15, y + r * 0.12 - o / 2);
    ctx.lineTo(x, y + r * 0.26 - o / 2);
    ctx.moveTo(x - r * 0.13, y + r * 0.16 + o / 2);
    ctx.lineTo(x + r * 0.13, y + r * 0.16 + o / 2);
    ctx.lineTo(x, y + r * 0.3 + o / 2);
    ctx.fill();
  }
}
function fruit(ctx, kind, x, y, r, blink, open) {
  if (kind === "apple") {
    ctx.strokeStyle = "#7a4a2a";
    ctx.lineWidth = r * 0.1;
    ctx.beginPath();
    ctx.moveTo(x, y - r * 0.8);
    ctx.lineTo(x + r * 0.1, y - r * 1.2);
    ctx.stroke();
    ell(ctx, x + r * 0.32, y - r * 1.05, r * 0.25, r * 0.12, -0.4, "#5cc95c");
    circ(ctx, x, y, r, "#ef4b4b");
    face(ctx, x, y + r * 0.05, r, blink, open);
  } else if (kind === "orange") {
    circ(ctx, x, y, r, "#ffa62b");
    for (let i = 0; i < 8; i++) circ(ctx, x + Math.cos(i * 2.4) * r * 0.7, y + Math.sin(i * 2.4) * r * 0.7, r * 0.04, "#ffc46b");
    ell(ctx, x + r * 0.2, y - r * 0.98, r * 0.22, r * 0.1, -0.3, "#5cc95c");
    face(ctx, x, y, r, blink, open);
  } else if (kind === "strawberry") {
    ctx.fillStyle = "#ff4d6a";
    ctx.beginPath();
    ctx.moveTo(x, y + r);
    ctx.bezierCurveTo(x - r * 1.3, y + r * 0.2, x - r * 1.05, y - r * 0.95, x, y - r * 0.8);
    ctx.bezierCurveTo(x + r * 1.05, y - r * 0.95, x + r * 1.3, y + r * 0.2, x, y + r);
    ctx.fill();
    for (let i = 0; i < 9; i++) ell(ctx, x + Math.sin(i * 2.1) * r * 0.6, y + Math.cos(i * 1.7) * r * 0.45 + r * 0.1, r * 0.03, r * 0.05, 0, "#ffe27a");
    ctx.fillStyle = "#4cb84c";
    ctx.beginPath();
    star5(ctx, x, y - r * 0.82, r * 0.35);
    ctx.fill();
    face(ctx, x, y - r * 0.12, r * 0.85, blink, open);
  } else if (kind === "watermelon") {
    ctx.fillStyle = "#3fae4f";
    ctx.beginPath();
    ctx.arc(x, y - r * 0.4, r * 1.15, 0, Math.PI);
    ctx.fill();
    ctx.fillStyle = "#ff5f7a";
    ctx.beginPath();
    ctx.arc(x, y - r * 0.4, r * 0.98, 0, Math.PI);
    ctx.fill();
    for (const [dx, dy] of [[-0.6, 0.05], [0.6, 0.05], [-0.3, 0.4], [0.3, 0.4]]) ell(ctx, x + dx * r, y - r * 0.4 + dy * r + r * 0.15, r * 0.04, r * 0.07, 0, INK);
    face(ctx, x, y - r * 0.05, r * 0.85, blink, open);
  } else {
    // grapes
    ell(ctx, x + r * 0.15, y - r * 1.05, r * 0.25, r * 0.11, -0.3, "#5cc95c");
    for (const [dx, dy] of [[-0.6, -0.55], [0, -0.65], [0.6, -0.55], [-0.75, 0.05], [0.75, 0.05], [-0.35, 0.6], [0.35, 0.6], [0, 0.95]])
      circ(ctx, x + dx * r, y + dy * r, r * 0.38, "#8e5bd8");
    circ(ctx, x, y, r * 0.62, "#a06ee6");
    face(ctx, x, y, r * 0.62, blink, open);
  }
}

/* One shared webcam stream for every Visualizer on the page. Only a real background
   (not a picker preview) switches it on, so browsing the picker never asks for the camera.
   Previews just show the stream once it's already running. */
const cam = { state: "idle", stream: null, video: null, err: "", users: 0, stopTimer: 0 };
function camAcquire() {
  cam.users++;
  clearTimeout(cam.stopTimer);
  if (cam.state === "live" || cam.state === "pending") return;
  if (!navigator.mediaDevices?.getUserMedia) {
    cam.state = "error";
    cam.err = "Camera isn't available in this browser";
    return;
  }
  cam.state = "pending";
  navigator.mediaDevices
    .getUserMedia({ video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false })
    .then((stream) => {
      if (cam.users <= 0) {
        stream.getTracks().forEach((tr) => tr.stop());
        cam.state = "idle";
        return;
      }
      const v = document.createElement("video");
      v.muted = true;
      v.playsInline = true;
      v.setAttribute("playsinline", "");
      v.srcObject = stream;
      v.play().catch(() => {});
      Object.assign(cam, { stream, video: v, state: "live" });
    })
    .catch((e) => {
      cam.state = "error";
      cam.err = e?.name === "NotAllowedError" ? "Camera blocked. Allow it in your browser." : "No camera found";
    });
}
function camRelease() {
  cam.users = Math.max(0, cam.users - 1);
  if (cam.users) return;
  cam.stopTimer = setTimeout(() => {
    if (cam.users || !cam.stream) return;
    cam.stream.getTracks().forEach((tr) => tr.stop());
    Object.assign(cam, { stream: null, video: null, state: "idle" });
  }, 800);
}
// Draw a mirrored video filling (x, y, ww, hh), cropping like object-fit: cover.
function cover(c, vid, x, y, ww, hh) {
  const vw = vid.videoWidth || 640, vh = vid.videoHeight || 480;
  const s = Math.max(ww / vw, hh / vh), dw = vw * s, dh = vh * s;
  c.save();
  c.translate(x + ww / 2, y + hh / 2);
  c.scale(-1, 1);
  c.drawImage(vid, -dw / 2, -dh / 2, dw, dh);
  c.restore();
}

function heart(ctx, x, y, r) {
  ctx.moveTo(x, y + r * 0.9);
  ctx.bezierCurveTo(x - r * 1.3, y, x - r * 0.6, y - r, x, y - r * 0.35);
  ctx.bezierCurveTo(x + r * 0.6, y - r, x + r * 1.3, y, x, y + r * 0.9);
}
// Four-point twinkle star.
function twinkle(ctx, x, y, r) {
  ctx.moveTo(x, y - r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.quadraticCurveTo(x, y, x, y + r);
  ctx.quadraticCurveTo(x, y, x - r, y);
  ctx.quadraticCurveTo(x, y, x, y - r);
}

const BINS = 64;
const WAVE = 256;
const rand = (a, b) => a + Math.random() * (b - a);

// Synthetic spectrum: a kick every ~0.5s plus wandering mids/highs.
function fakeSpectrum(t, out) {
  const beat = Math.pow(Math.max(0, Math.sin(t * Math.PI * 2 * 2)), 8);
  for (let i = 0; i < BINS; i++) {
    const f = i / BINS;
    const low = (1 - f) * (0.35 + 0.65 * beat);
    const wobble = 0.5 + 0.5 * Math.sin(t * (1.3 + f * 4) + i * 0.7) * Math.sin(t * 0.7 + i * 0.31);
    out[i] = Math.min(1, low * 0.9 + wobble * 0.55 * (1 - f * 0.6));
  }
}
function fakeWave(t, out, level) {
  for (let i = 0; i < WAVE; i++) {
    const x = i / WAVE;
    out[i] =
      level *
      (0.55 * Math.sin(x * 18 + t * 9) * Math.sin(x * 3.1 + t * 1.3) + 0.25 * Math.sin(x * 61 - t * 14) + 0.15 * Math.sin(x * 127 + t * 5));
  }
}

export default function Visualizer({ mode, analyserRef, playing, hue = 340, intense = false, preview = false, className = "" }) {
  const canvasRef = useRef(null);
  const live = useRef({});
  live.current = { mode, playing, hue, intense, preview };

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    let w = 0, h = 0, dpr = 1, raf = 0, last = performance.now(), t = 0;
    const spec = new Float32Array(BINS); // smoothed 0..1
    const raw = new Float32Array(BINS);
    const wave = new Float32Array(WAVE); // -1..1
    let freqBuf = null, timeBuf = null, realAudio = false;
    let energy = 0; // eased "how lively" (0 when paused, 1 when playing)
    let bass = 0, bassAvg = 0, lastBeat = 0, gridZ = 0, tunnelZ = 0, flash = 0;
    let ts = 0; // steady slow clock for the sleep effects
    const S = {}; // lazily created state for the newer effects
    const once = (k, f) => S[k] || (S[k] = f());
    let camHeld = false;

    // per-effect state
    const stars = Array.from({ length: 260 }, () => ({ x: rand(-1, 1), y: rand(-1, 1), z: Math.random() }));
    const rings = [];
    const bubbles = Array.from({ length: 40 }, () => ({ x: Math.random(), y: Math.random(), r: rand(0.01, 0.05), s: rand(0.03, 0.1), p: rand(0, 6.28), b: Math.floor(rand(0, 40)) }));
    const nodes = Array.from({ length: 70 }, () => ({ x: Math.random(), y: Math.random(), vx: rand(-0.02, 0.02), vy: rand(-0.02, 0.02), b: Math.floor(rand(0, 48)) }));

    const resize = () => {
      const r = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = r.width;
      h = r.height;
      canvas.width = Math.max(1, Math.round(w * dpr));
      canvas.height = Math.max(1, Math.round(h * dpr));
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    // Skip drawing while scrolled out of view (e.g. previews further down the picker).
    let visible = true;
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
    io.observe(canvas);

    const readAudio = () => {
      const an = analyserRef?.current;
      realAudio = false;
      if (an && live.current.playing) {
        if (!freqBuf || freqBuf.length !== an.frequencyBinCount) freqBuf = new Uint8Array(an.frequencyBinCount);
        if (!timeBuf || timeBuf.length !== an.fftSize) timeBuf = new Uint8Array(an.fftSize);
        an.getByteFrequencyData(freqBuf);
        // Log-spaced bins so bass and treble both get room.
        const n = freqBuf.length;
        let sum = 0;
        for (let i = 0; i < BINS; i++) {
          const a = Math.floor(Math.pow(n * 0.75, i / BINS));
          const b = Math.max(a + 1, Math.floor(Math.pow(n * 0.75, (i + 1) / BINS)));
          let m = 0;
          for (let j = a; j < b && j < n; j++) m = Math.max(m, freqBuf[j]);
          raw[i] = m / 255;
          sum += m;
        }
        if (sum > 0) {
          realAudio = true;
          an.getByteTimeDomainData(timeBuf);
          const step = timeBuf.length / WAVE;
          for (let i = 0; i < WAVE; i++) wave[i] = (timeBuf[Math.floor(i * step)] - 128) / 128;
          return;
        }
      }
      fakeSpectrum(t, raw); // no analyser, or it's silent (e.g. YouTube without capture)
    };

    const isDark = () => {
      const bg = getComputedStyle(document.documentElement).getPropertyValue("--bg").trim();
      return bg === "#000000" || bg === "#000";
    };

    const draw = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const { mode, playing, hue, intense, preview } = live.current;
      const wantCam = CAMERA.has(mode) && !preview;
      if (wantCam !== camHeld) {
        camHeld = wantCam;
        if (wantCam) camAcquire();
        else camRelease();
      }
      if (!visible) {
        raf = reduced ? 0 : requestAnimationFrame(draw);
        return;
      }
      energy += ((playing ? 1 : 0.12) - energy) * Math.min(1, dt * 2.5);
      t += dt * (0.25 + energy * 0.75);

      readAudio();
      if (!realAudio) fakeWave(t, wave, 0.15 + 0.5 * energy);
      for (let i = 0; i < BINS; i++) {
        const target = raw[i] * energy;
        spec[i] += (target - spec[i]) * (target > spec[i] ? 0.5 : 0.12);
      }
      let b = 0;
      for (let i = 0; i < 6; i++) b += spec[i];
      bass += (b / 6 - bass) * 0.35;
      bassAvg += (bass - bassAvg) * 0.03;
      const beat = playing && bass > 0.25 && bass > bassAvg * 1.2 && now - lastBeat > 280;
      if (beat) lastBeat = now;
      ts += dt;
      flash = beat ? 1 : Math.max(0, flash - dt * 3);

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      if (mode === "off") {
        raf = reduced ? 0 : requestAnimationFrame(draw);
        return;
      }
      const dark = intense || isDark();
      const L = dark ? 55 : 60;
      const A = (intense ? 1 : dark ? 0.75 : 0.55) * (0.55 + 0.45 * energy);
      const col = (dh, a, l = L, s = 85) => `hsla(${(((hue + dh) % 360) + 360) % 360} ${s}% ${l}% / ${a})`;
      const glowAt = (x, y, r, a, dh = 0) => {
        const g = ctx.createRadialGradient(x, y, 0, x, y, Math.max(1, r));
        g.addColorStop(0, col(dh, a));
        g.addColorStop(1, col(dh, 0));
        ctx.fillStyle = g;
        ctx.fillRect(x - r, y - r, r * 2, r * 2); // gradient is transparent past r
      };
      const hsl = (hh, a, l = 60, s = 90) => `hsla(${((hh % 360) + 360) % 360} ${s}% ${l}% / ${a})`;
      const glowAbs = (x, y, r, a, hh, l = 60, s = 90) => {
        const g = ctx.createRadialGradient(x, y, 0, x, y, Math.max(1, r));
        g.addColorStop(0, hsl(hh, a, l, s));
        g.addColorStop(1, hsl(hh, 0, l, s));
        ctx.fillStyle = g;
        ctx.fillRect(x - r, y - r, r * 2, r * 2);
      };
      const m = Math.min(w, h);
      const k7 = Math.max(0.5, m / 700); // size scale so previews look like the full thing
      const GA = Math.min(1, A * 1.3); // cartoon scenes stay bright and readable
      const skyFill = (c1, c2) => {
        const g = ctx.createLinearGradient(0, 0, 0, h);
        g.addColorStop(0, c1);
        g.addColorStop(1, c2);
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
      };
      const sunFace = (x, y, r, sleepy = false) => {
        ctx.fillStyle = "#ffcf3f";
        ctx.beginPath();
        for (let i = 0; i < 12; i++) {
          const a = (i / 12) * Math.PI * 2 + ts * 0.2;
          ctx.moveTo(x + Math.cos(a - 0.12) * r * 1.15, y + Math.sin(a - 0.12) * r * 1.15);
          ctx.lineTo(x + Math.cos(a) * r * 1.55, y + Math.sin(a) * r * 1.55);
          ctx.lineTo(x + Math.cos(a + 0.12) * r * 1.15, y + Math.sin(a + 0.12) * r * 1.15);
        }
        ctx.fill();
        circ(ctx, x, y, r, "#ffd84d");
        face(ctx, x, y, r, blinkAt(ts, 5), 0, sleepy);
      };
      const driftClouds = (key, n, fill, speed = 0.015, size = 0.05) => {
        const cl = once(key, () => Array.from({ length: n }, (_, i) => ({ x: i / n + rand(0, 0.15), y: rand(0.08, 0.45), s: rand(0.6, 1.2), v: rand(0.6, 1.4) })));
        ctx.fillStyle = fill;
        for (const c of cl) {
          c.x -= dt * speed * c.v;
          if (c.x < -0.25) c.x = 1.25;
          cloud(ctx, c.x * w, c.y * h, m * size * c.s);
        }
      };
      const floatNotes = () => {
        const notes = once("notes", () => []);
        if ((beat || Math.random() < dt * 1.2) && notes.length < 16) notes.push({ x: rand(0.05, 0.95) * w, y: h * rand(0.45, 0.7), life: 1, c: KIDS[Math.floor(rand(0, KIDS.length))], g: Math.random() < 0.5 ? "♪" : "♫" });
        ctx.font = `700 ${Math.round(26 * k7)}px system-ui, sans-serif`;
        ctx.textAlign = "center";
        for (let i = notes.length - 1; i >= 0; i--) {
          const n = notes[i];
          n.y -= dt * 45 * k7;
          n.life -= dt * 0.35;
          if (n.life <= 0) {
            notes.splice(i, 1);
            continue;
          }
          ctx.fillStyle = hsl(n.c, Math.min(1, n.life * 1.5) * GA, 55, 90);
          ctx.fillText(n.g, n.x + Math.sin(n.life * 8) * 8 * k7, n.y);
        }
      };
      ctx.globalCompositeOperation = dark && !SOLID.has(mode) ? "lighter" : "source-over";
      ctx.lineCap = "round";

      if (mode === "aurora") {
        const blobs = [
          [0, 0.25, 0.3, 0.9],
          [70, 0.75, 0.7, 1.1],
          [180, 0.5, 0.45, 0.7],
          [-50, 0.2, 0.8, 1.3],
        ];
        blobs.forEach(([dh, bx, by, sp], k) => {
          const x = w * (bx + 0.22 * Math.sin(t * sp * 0.6 + k));
          const y = h * (by + 0.18 * Math.cos(t * sp * 0.5 + k * 2));
          const r = Math.max(w, h) * (0.32 + 0.12 * Math.sin(t * sp + k) + 0.25 * bass);
          glowAt(x, y, r, 0.55 * A, dh);
        });
      } else if (mode === "bars") {
        const n = w < 400 ? 24 : 48;
        const gap = Math.max(2, w / 300);
        const bw = (w - gap * (n + 1)) / n;
        const maxH = h * (intense ? 0.55 : 0.45);
        for (let i = 0; i < n; i++) {
          // mirror: bass in the middle, treble at the edges
          const k = Math.abs(i - (n - 1) / 2) / (n / 2);
          const v = spec[Math.min(BINS - 1, Math.floor(k * BINS * 0.9))];
          const bh = Math.max(3, v * maxH);
          const x = gap + i * (bw + gap);
          const g = ctx.createLinearGradient(0, h - bh, 0, h);
          g.addColorStop(0, col(k * 120, 0.95 * A, L + 10));
          g.addColorStop(1, col(k * 120 + 40, 0.15 * A));
          ctx.fillStyle = g;
          ctx.beginPath();
          if (ctx.roundRect) ctx.roundRect(x, h - bh, bw, bh + 8, Math.min(bw / 2, 8));
          else ctx.rect(x, h - bh, bw, bh);
          ctx.fill();
        }
        glowAt(w / 2, h, w * 0.6, 0.3 * A * (0.4 + bass));
      } else if (mode === "ring") {
        const cx = w / 2, cy = h / 2;
        const R = m * (0.22 + 0.06 * bass);
        glowAt(cx, cy, R * 2.6, 0.35 * A * (0.5 + bass));
        const n = 120;
        ctx.lineWidth = Math.max(2, m / 220);
        for (let i = 0; i < n; i++) {
          const k = Math.abs(i - n / 2) / (n / 2); // symmetric
          const v = spec[Math.floor(k * (BINS - 1))];
          const a = (i / n) * Math.PI * 2 + t * 0.4;
          const len = R * (0.08 + v * 0.9);
          ctx.strokeStyle = col(k * 160, 0.9 * A, L + 8);
          ctx.beginPath();
          ctx.moveTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R);
          ctx.lineTo(cx + Math.cos(a) * (R + len), cy + Math.sin(a) * (R + len));
          ctx.stroke();
        }
        ctx.strokeStyle = col(30, 0.5 * A);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cx, cy, R * 0.92, 0, Math.PI * 2);
        ctx.stroke();
      } else if (mode === "waves") {
        const layers = 5;
        for (let l = 0; l < layers; l++) {
          const f = l / (layers - 1);
          const band = spec[Math.floor(f * (BINS - 1) * 0.6)];
          const amp = h * (0.05 + 0.16 * band + 0.03 * Math.sin(t + l));
          const yBase = h * (0.45 + f * 0.12);
          ctx.beginPath();
          ctx.moveTo(0, h);
          for (let x = 0; x <= w; x += 8) {
            const u = (x / w) * Math.PI * 2; // ~1 and ~2 cycles across the screen, at any size
            const y = yBase + Math.sin(u + t * (1.2 + f) + l * 1.7) * amp + Math.sin(u * 2.2 - t * (0.8 + f * 0.5) + l) * amp * 0.45;
            ctx.lineTo(x, y);
          }
          ctx.lineTo(w, h);
          ctx.closePath();
          const g = ctx.createLinearGradient(0, yBase - amp, 0, h);
          g.addColorStop(0, col(l * 40, 0.42 * A, L + 5));
          g.addColorStop(1, col(l * 40 + 30, 0));
          ctx.fillStyle = g;
          ctx.fill();
        }
      } else if (mode === "particles") {
        const cx = w / 2, cy = h / 2;
        const speed = (0.08 + bass * 1.4) * dt * (reduced ? 0 : 1);
        const scale = Math.max(w, h) * 0.5;
        for (const s of stars) {
          s.z -= speed;
          if (s.z <= 0.02) {
            s.x = rand(-1, 1);
            s.y = rand(-1, 1);
            s.z = 1;
          }
          const px = cx + (s.x / s.z) * scale * 0.5;
          const py = cy + (s.y / s.z) * scale * 0.5;
          if (px < -20 || px > w + 20 || py < -20 || py > h + 20) {
            s.z = 0;
            continue;
          }
          const size = (1 - s.z) * (2.5 + bass * 3) * Math.max(0.5, m / 700);
          const pz = s.z + speed * 6; // trail
          ctx.strokeStyle = col((s.x + s.y) * 90, (1 - s.z) * A, dark ? 70 : 50);
          ctx.lineWidth = Math.max(0.5, size);
          ctx.beginPath();
          ctx.moveTo(cx + (s.x / pz) * scale * 0.5, cy + (s.y / pz) * scale * 0.5);
          ctx.lineTo(px, py);
          ctx.stroke();
        }
        glowAt(cx, cy, m * 0.5, 0.25 * A * (0.3 + bass));
      } else if (mode === "pulse") {
        const cx = w / 2, cy = h / 2;
        if (beat || (now - lastBeat > 900 && Math.random() < dt * 1.2)) rings.push({ r: m * 0.05, a: 1, dh: rand(-40, 80), wdt: 2 + bass * 8 });
        const maxR = Math.hypot(w, h) / 2;
        for (let i = rings.length - 1; i >= 0; i--) {
          const r = rings[i];
          r.r += dt * m * (0.35 + bass * 0.6);
          r.a = 1 - r.r / maxR;
          if (r.a <= 0) {
            rings.splice(i, 1);
            continue;
          }
          ctx.strokeStyle = col(r.dh, r.a * A, L + 10);
          ctx.lineWidth = r.wdt * (m / 600) + 1;
          ctx.beginPath();
          ctx.arc(cx, cy, r.r, 0, Math.PI * 2);
          ctx.stroke();
        }
        glowAt(cx, cy, m * (0.18 + bass * 0.25), 0.7 * A * (0.3 + bass), 20);
      } else if (mode === "retro") {
        const hy = h * 0.58; // horizon
        // sun
        const sr = m * (0.2 + bass * 0.05);
        const sy = hy - sr * 0.35;
        const sg = ctx.createLinearGradient(0, sy - sr, 0, sy + sr);
        sg.addColorStop(0, col(50, 0.95 * A, 62));
        sg.addColorStop(1, col(-20, 0.95 * A, 55));
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, 0, w, hy);
        ctx.clip();
        ctx.fillStyle = sg;
        ctx.beginPath();
        ctx.arc(w / 2, sy, sr, 0, Math.PI * 2);
        ctx.fill();
        // sun stripes
        ctx.globalCompositeOperation = "destination-out";
        for (let i = 0; i < 6; i++) {
          const y = sy + sr * (0.1 + i * 0.16);
          ctx.fillRect(0, y, w, (i + 1) * sr * 0.022);
        }
        ctx.restore();
        ctx.globalCompositeOperation = dark ? "lighter" : "source-over";
        glowAt(w / 2, hy, m * 0.7, 0.35 * A * (0.4 + bass), 0);
        // grid
        gridZ = (gridZ + dt * (0.4 + bass * 2.2)) % 1;
        ctx.strokeStyle = col(-60, 0.7 * A, 62);
        ctx.lineWidth = Math.max(1, m / 500);
        for (let i = 0; i < 14; i++) {
          const z = (i + 1 - gridZ) / 14;
          const y = hy + (h - hy) * Math.pow(z, 2.2);
          ctx.globalAlpha = Math.min(1, z * 2);
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(w, y);
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
        for (let i = -12; i <= 12; i++) {
          ctx.beginPath();
          ctx.moveTo(w / 2 + i * w * 0.02, hy);
          ctx.lineTo(w / 2 + i * w * 0.16, h);
          ctx.stroke();
        }
        ctx.strokeStyle = col(-60, 0.9 * A, 70);
        ctx.beginPath();
        ctx.moveTo(0, hy);
        ctx.lineTo(w, hy);
        ctx.stroke();
      } else if (mode === "galaxy") {
        const cx = w / 2, cy = h / 2;
        glowAt(cx, cy, m * 0.35, 0.5 * A * (0.4 + bass), 30);
        const n = 700;
        const spread = m * 0.48 * (1 + bass * 0.15);
        for (let i = 0; i < n; i++) {
          const f = i / n;
          const arm = i % 3;
          const a = f * 9 + arm * ((Math.PI * 2) / 3) + t * 0.35;
          const r = Math.pow(f, 0.7) * spread;
          const v = spec[Math.floor(f * (BINS - 1))];
          const jitter = Math.sin(i * 12.9898) * 0.25;
          const x = cx + Math.cos(a + jitter) * r;
          const y = cy + Math.sin(a + jitter) * r * 0.85;
          const size = (0.6 + v * 2.6) * Math.max(0.6, m / 700);
          ctx.fillStyle = col(f * 160 - 30, (0.35 + v * 0.65) * A, L + 12);
          ctx.beginPath();
          ctx.arc(x, y, size, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (mode === "bubbles") {
        for (const bb of bubbles) {
          const v = spec[bb.b];
          bb.y -= dt * bb.s * (0.6 + bass * 2.5);
          if (bb.y < -0.1) {
            bb.y = 1.1;
            bb.x = Math.random();
          }
          const x = (bb.x + Math.sin(t * 1.5 + bb.p) * 0.03) * w;
          const y = bb.y * h;
          const r = bb.r * m * (0.8 + v * 1.2);
          const g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.35, r * 0.1, x, y, r);
          g.addColorStop(0, col(bb.b * 4, 0.55 * A, 80));
          g.addColorStop(0.7, col(bb.b * 4, 0.18 * A));
          g.addColorStop(1, col(bb.b * 4, 0.45 * A, 70));
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(x, y, r, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (mode === "constellation") {
        const sp = 0.5 + bass * 3;
        for (const p of nodes) {
          p.x += p.vx * dt * sp;
          p.y += p.vy * dt * sp;
          if (p.x < 0 || p.x > 1) p.vx *= -1;
          if (p.y < 0 || p.y > 1) p.vy *= -1;
        }
        const maxD = m * 0.18;
        ctx.lineWidth = 1;
        for (let i = 0; i < nodes.length; i++) {
          const a = nodes[i];
          for (let j = i + 1; j < nodes.length; j++) {
            const c = nodes[j];
            const d = Math.hypot((a.x - c.x) * w, (a.y - c.y) * h);
            if (d < maxD) {
              ctx.strokeStyle = col(a.b * 3, (1 - d / maxD) * 0.6 * A * (0.4 + bass));
              ctx.beginPath();
              ctx.moveTo(a.x * w, a.y * h);
              ctx.lineTo(c.x * w, c.y * h);
              ctx.stroke();
            }
          }
        }
        for (const p of nodes) {
          const v = spec[p.b];
          const r = (1.5 + v * 5) * Math.max(0.6, m / 700);
          glowAt(p.x * w, p.y * h, r * 5, 0.25 * A * v, p.b * 3);
          ctx.fillStyle = col(p.b * 3, A, 80);
          ctx.beginPath();
          ctx.arc(p.x * w, p.y * h, r, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (mode === "scope") {
        const cy = h / 2;
        const amp = h * 0.32;
        glowAt(w / 2, cy, m * 0.6, 0.25 * A * (0.3 + bass));
        const pass = [
          [10, 0.15],
          [4, 0.4],
          [1.6, 1],
        ];
        for (const [lw, a] of pass) {
          for (const dir of [1, -1]) {
            ctx.strokeStyle = col(dir > 0 ? 0 : 60, a * A, dir > 0 ? L + 10 : L);
            ctx.lineWidth = lw * Math.max(0.6, m / 700);
            ctx.beginPath();
            for (let i = 0; i < WAVE; i++) {
              const x = (i / (WAVE - 1)) * w;
              const edge = Math.sin((i / (WAVE - 1)) * Math.PI); // taper at the ends
              const y = cy + wave[i] * amp * edge * dir;
              if (i === 0) ctx.moveTo(x, y);
              else ctx.lineTo(x, y);
            }
            ctx.stroke();
          }
        }
      } else if (mode === "balloons") {
        const list = once("balloons", () =>
          Array.from({ length: 14 }, (_, i) => ({ x: Math.random(), y: rand(0.1, 1.3), r: rand(0.045, 0.075), s: rand(0.04, 0.08), p: rand(0, 6.28), c: KIDS[i % KIDS.length] }))
        );
        for (const bl of list) {
          bl.y -= dt * bl.s * (0.7 + bass * 1.5);
          if (bl.y < -0.25) {
            bl.y = 1.25;
            bl.x = Math.random();
          }
          const r = bl.r * m * (1 + bass * 0.15);
          const x = (bl.x + Math.sin(t * 0.9 + bl.p) * 0.025) * w;
          const y = bl.y * h;
          ctx.strokeStyle = dark ? `rgba(255,255,255,${0.4 * A})` : `rgba(0,0,0,${0.3 * A})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(x, y + r * 1.25);
          ctx.quadraticCurveTo(x + Math.sin(t * 2 + bl.p) * r * 0.6, y + r * 2.2, x, y + r * 3.2);
          ctx.stroke();
          const g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.45, r * 0.1, x, y, r * 1.25);
          g.addColorStop(0, hsl(bl.c, A, 82));
          g.addColorStop(1, hsl(bl.c, A, 50));
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.ellipse(x, y, r, r * 1.2, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.moveTo(x - r * 0.15, y + r * 1.32);
          ctx.lineTo(x + r * 0.15, y + r * 1.32);
          ctx.lineTo(x, y + r * 1.15);
          ctx.fill();
        }
      } else if (mode === "rainbow") {
        const cx = w / 2, cy = h * 1.02;
        const R = Math.min(w * 0.45, h * 0.75) * (1 + bass * 0.06);
        const band = R * 0.075;
        [0, 30, 55, 120, 200, 240, 280].forEach((hh, i) => {
          ctx.strokeStyle = hsl(hh, 0.8 * A, 60);
          ctx.lineWidth = band + 1;
          ctx.beginPath();
          ctx.arc(cx, cy, R - i * band, Math.PI, 0);
          ctx.stroke();
        });
        const clouds = once("clouds", () => Array.from({ length: 4 }, (_, i) => ({ x: i / 4 + rand(0, 0.2), y: rand(0.1, 0.4), s: rand(0.7, 1.2) })));
        for (const c of clouds) {
          c.x += dt * 0.015 * (0.5 + bass);
          if (c.x > 1.2) c.x = -0.2;
          const r = m * 0.06 * c.s * (1 + bass * 0.08);
          const x = c.x * w, y = c.y * h;
          ctx.fillStyle = dark ? `rgba(255,255,255,${0.85 * A})` : `rgba(255,255,255,${0.95 * A})`;
          ctx.beginPath();
          for (const [dx, dy, rr] of [[-1.1, 0.2, 0.7], [-0.4, -0.3, 1], [0.5, -0.1, 0.85], [1.2, 0.25, 0.65], [0, 0.35, 0.8]]) {
            ctx.moveTo(x + dx * r + rr * r, y + dy * r);
            ctx.arc(x + dx * r, y + dy * r, rr * r, 0, Math.PI * 2);
          }
          ctx.fill();
        }
        // sparkles
        for (let i = 0; i < 18; i++) {
          const a = 0.5 + 0.5 * Math.sin(t * 3 + i * 1.7);
          const x = ((Math.sin(i * 91.7) + 1) / 2) * w, y = ((Math.sin(i * 47.3) + 1) / 2) * h * 0.7;
          ctx.fillStyle = hsl(KIDS[i % KIDS.length], a * A, 70);
          ctx.beginPath();
          ctx.arc(x, y, (1.5 + spec[i * 2] * 4) * k7, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (mode === "shapes") {
        const list = once("shapes", () =>
          Array.from({ length: 22 }, (_, i) => ({ x: Math.random(), y: Math.random(), vx: rand(-0.04, 0.04), vy: rand(-0.04, 0.04), k: i % 4, c: KIDS[i % KIDS.length], r: rand(0.03, 0.06), rot: rand(0, 6.28), vr: rand(-0.8, 0.8), b: Math.floor(rand(0, 40)) }))
        );
        for (const s of list) {
          s.x = (s.x + s.vx * dt * (0.5 + bass * 2) + 1.1) % 1.1;
          s.y = (s.y + s.vy * dt * (0.5 + bass * 2) + 1.1) % 1.1;
          s.rot += s.vr * dt;
          const r = s.r * m * (1 + spec[s.b] * 0.7);
          ctx.save();
          ctx.translate(s.x * w, s.y * h);
          ctx.rotate(s.rot);
          ctx.fillStyle = hsl(s.c, 0.9 * A, 62);
          ctx.beginPath();
          if (s.k === 0) ctx.arc(0, 0, r * 0.8, 0, Math.PI * 2);
          else if (s.k === 1) {
            for (let i = 0; i < 10; i++) {
              const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
              const rr = i % 2 ? r * 0.45 : r;
              ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
            }
          } else if (s.k === 2) {
            ctx.moveTo(0, r * 0.9);
            ctx.bezierCurveTo(-r * 1.3, 0, -r * 0.6, -r, 0, -r * 0.35);
            ctx.bezierCurveTo(r * 0.6, -r, r * 1.3, 0, 0, r * 0.9);
          } else {
            ctx.moveTo(0, -r);
            ctx.lineTo(r * 0.9, r * 0.7);
            ctx.lineTo(-r * 0.9, r * 0.7);
          }
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        }
      } else if (mode === "nightsky") {
        const sky = ctx.createLinearGradient(0, 0, 0, h);
        const sa = dark ? 0.95 : 0.8;
        sky.addColorStop(0, `rgba(8,12,36,${sa})`);
        sky.addColorStop(1, `rgba(36,28,78,${sa})`);
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, w, h);
        const st = once("sky", () => Array.from({ length: 160 }, () => ({ x: Math.random(), y: Math.random(), s: rand(0.4, 1.6), p: rand(0, 6.28), sp: rand(0.3, 1) })));
        for (const s of st) {
          const a = 0.25 + 0.75 * (0.5 + 0.5 * Math.sin(ts * s.sp + s.p));
          ctx.fillStyle = `rgba(255,250,235,${a * 0.9})`;
          ctx.beginPath();
          ctx.arc(s.x * w, s.y * h, s.s * k7, 0, Math.PI * 2);
          ctx.fill();
        }
        const mx = w * 0.72, my = h * 0.26, mr = m * 0.09 * (1 + 0.02 * Math.sin(ts * 0.8));
        glowAbs(mx, my, mr * 4, 0.25, 50, 75, 80);
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, 0, w, h);
        ctx.arc(mx + mr * 0.45, my - mr * 0.25, mr * 0.85, 0, Math.PI * 2);
        ctx.clip("evenodd");
        ctx.fillStyle = "#fdf3c4";
        ctx.beginPath();
        ctx.arc(mx, my, mr, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      } else if (mode === "nightlight") {
        const hh = 30 - ((Math.sin(ts * 0.07) + 1) / 2) * 130; // amber → pink → lavender, very slowly
        const breathe = 0.5 + 0.5 * Math.sin((ts * Math.PI * 2) / 8); // one slow breath every 8s
        glowAbs(w / 2, h / 2, Math.max(w, h) * (0.45 + 0.1 * breathe), (0.35 + 0.25 * breathe) * (dark ? 1 : 0.8), hh, 60, 70);
        glowAbs(w / 2, h / 2, m * 0.2, 0.25 + 0.15 * breathe, hh + 20, 75, 70);
        const motes = once("motes", () => Array.from({ length: 26 }, () => ({ x: Math.random(), y: Math.random(), s: rand(0.008, 0.02), p: rand(0, 6.28) })));
        for (const d of motes) {
          d.y -= dt * d.s;
          if (d.y < -0.05) d.y = 1.05;
          const x = (d.x + Math.sin(ts * 0.3 + d.p) * 0.02) * w;
          ctx.fillStyle = hsl(hh + 30, 0.35 + 0.25 * Math.sin(ts + d.p), 80, 70);
          ctx.beginPath();
          ctx.arc(x, d.y * h, 2 * k7, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (mode === "fireflies") {
        const base = ctx.createLinearGradient(0, 0, 0, h);
        base.addColorStop(0, `rgba(4,10,20,${dark ? 0.6 : 0.45})`);
        base.addColorStop(1, `rgba(10,40,30,${dark ? 0.7 : 0.55})`);
        ctx.fillStyle = base;
        ctx.fillRect(0, 0, w, h);
        const flies = once("flies", () => Array.from({ length: 45 }, () => ({ x: Math.random(), y: rand(0.2, 1), p: rand(0, 6.28), q: rand(0, 6.28), sp: rand(0.5, 1.2) })));
        for (const f of flies) {
          const x = (f.x + Math.sin(ts * 0.12 * f.sp + f.p) * 0.08) * w;
          const y = (f.y + Math.cos(ts * 0.1 * f.sp + f.q) * 0.06) * h;
          const a = Math.pow(Math.max(0, Math.sin(ts * 0.5 * f.sp + f.q)), 2);
          if (a < 0.02) continue;
          glowAbs(x, y, 18 * k7, 0.5 * a, 70, 60, 90);
          ctx.fillStyle = `rgba(230,255,170,${a})`;
          ctx.beginPath();
          ctx.arc(x, y, 1.8 * k7, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (mode === "confetti") {
        const parts = once("confetti", () => []);
        const sc = k7;
        const spawn = (x, y, vx, vy) =>
          parts.length < 450 &&
          parts.push({ x, y, vx, vy, r: rand(0, 6.28), vr: rand(-8, 8), c: KIDS[Math.floor(rand(0, KIDS.length))], s: rand(5, 10) * sc });
        if (beat || (!realAudio && Math.random() < dt * 0.6)) {
          for (let i = 0; i < 40; i++) {
            spawn(0, h, rand(150, 450) * sc, -rand(450, 850) * sc);
            spawn(w, h, -rand(150, 450) * sc, -rand(450, 850) * sc);
          }
        }
        if (Math.random() < dt * 25 * energy) spawn(Math.random() * w, -10, rand(-30, 30), rand(40, 120) * sc);
        for (let i = parts.length - 1; i >= 0; i--) {
          const c = parts[i];
          c.vy += 420 * sc * dt;
          c.vx *= 1 - dt * 1.2;
          c.vy = Math.min(c.vy, 180 * sc); // flutter down
          c.x += c.vx * dt + Math.sin(ts * 3 + c.r) * 0.6;
          c.y += c.vy * dt;
          c.r += c.vr * dt;
          if (c.y > h + 20) {
            parts.splice(i, 1);
            continue;
          }
          ctx.save();
          ctx.translate(c.x, c.y);
          ctx.rotate(c.r);
          ctx.fillStyle = hsl(c.c, A, 60);
          ctx.fillRect(-c.s / 2, (-c.s / 4) * Math.abs(Math.cos(c.r * 1.7)), c.s, (c.s / 2) * Math.abs(Math.cos(c.r * 1.7)) + 1);
          ctx.restore();
        }
      } else if (mode === "disco") {
        const cx = w / 2, cy = h * 0.16, R = m * 0.09;
        for (let i = 0; i < 10; i++) {
          const a = (i / 10) * Math.PI * 2 + t * 0.6;
          const px = cx + Math.cos(a) * w * 0.55;
          const py = h * 0.62 + Math.sin(a * 1.3) * h * 0.3;
          const hh = i * 36 + t * 25;
          const beam = ctx.createLinearGradient(cx, cy, px, py);
          beam.addColorStop(0, hsl(hh, 0.25 * A * (0.5 + flash), 60));
          beam.addColorStop(1, hsl(hh, 0, 60));
          ctx.fillStyle = beam;
          const sw = m * 0.07;
          const nx = -(py - cy), ny = px - cx, nl = Math.hypot(nx, ny) || 1;
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.lineTo(px + (nx / nl) * sw, py + (ny / nl) * sw);
          ctx.lineTo(px - (nx / nl) * sw, py - (ny / nl) * sw);
          ctx.fill();
          glowAbs(px, py, m * (0.1 + bass * 0.08), (0.45 + flash * 0.35) * A, hh, 60);
        }
        // the mirror ball
        ctx.globalCompositeOperation = "source-over";
        ctx.strokeStyle = dark ? "rgba(255,255,255,.35)" : "rgba(0,0,0,.25)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(cx, 0);
        ctx.lineTo(cx, cy - R);
        ctx.stroke();
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, R, 0, Math.PI * 2);
        ctx.clip();
        const bg = ctx.createRadialGradient(cx - R * 0.3, cy - R * 0.3, 0, cx, cy, R);
        bg.addColorStop(0, "#e8e8f0");
        bg.addColorStop(1, "#4a4a5a");
        ctx.fillStyle = bg;
        ctx.fillRect(cx - R, cy - R, R * 2, R * 2);
        const tile = R / 4;
        for (let gy = -R; gy < R; gy += tile) {
          for (let gx = -R; gx < R; gx += tile) {
            const n = Math.sin(gx * 13.1 + gy * 7.7 + Math.floor(t * 6) * 3.3);
            if (n > 0.6) {
              ctx.fillStyle = hsl(n * 400 + t * 40, 0.9, 85, 60);
              ctx.fillRect(cx + gx + 1, cy + gy + 1, tile - 2, tile - 2);
            }
          }
        }
        ctx.strokeStyle = "rgba(0,0,0,.25)";
        for (let g = -R; g <= R; g += tile) {
          ctx.beginPath();
          ctx.moveTo(cx + g, cy - R);
          ctx.lineTo(cx + g, cy + R);
          ctx.moveTo(cx - R, cy + g);
          ctx.lineTo(cx + R, cy + g);
          ctx.stroke();
        }
        ctx.restore();
      } else if (mode === "lasers") {
        glowAt(w / 2, h, m * 0.9, 0.2 * A * (0.4 + bass), 0);
        const origins = [
          [0, h, -Math.PI / 4],
          [w, h, (-3 * Math.PI) / 4],
          [w / 2, h, -Math.PI / 2],
        ];
        const len = Math.hypot(w, h);
        origins.forEach(([ox, oy, base], k) => {
          const hh = hue + k * 120 + t * 20;
          const sweep = Math.sin(t * (1.1 + k * 0.3) + k * 2) * 0.55;
          for (let j = 0; j < 5; j++) {
            const a = base + (j - 2) * 0.16 + sweep;
            const ex = ox + Math.cos(a) * len, ey = oy + Math.sin(a) * len;
            for (const [lw, al] of [[8, 0.12], [3, 0.35], [1.2, 1]]) {
              ctx.strokeStyle = hsl(hh, al * A * (0.55 + 0.45 * flash + bass * 0.3), 60, 100);
              ctx.lineWidth = lw * k7;
              ctx.beginPath();
              ctx.moveTo(ox, oy);
              ctx.lineTo(ex, ey);
              ctx.stroke();
            }
          }
        });
      } else if (mode === "tunnel") {
        tunnelZ = (tunnelZ + dt * (0.25 + bass * 1.2)) % 1;
        const N = 14;
        const cx = w / 2 + Math.sin(t * 0.7) * w * 0.04, cy = h / 2 + Math.cos(t * 0.5) * h * 0.04;
        for (let i = 0; i < N; i++) {
          const p = (i + tunnelZ) / N;
          const size = Math.pow(p, 2.4) * Math.max(w, h) * 1.3;
          const rot = p * 0.6 + t * 0.15;
          ctx.save();
          ctx.translate(cx, cy);
          ctx.rotate(rot);
          ctx.strokeStyle = hsl(hue + i * 25 + t * 30, p * A * (0.7 + flash * 0.3), 60, 100);
          ctx.lineWidth = (1 + p * 6) * k7;
          ctx.beginPath();
          if (ctx.roundRect) ctx.roundRect(-size / 2, -size / 2, size, size, size * 0.12);
          else ctx.rect(-size / 2, -size / 2, size, size);
          ctx.stroke();
          ctx.restore();
        }
        glowAt(cx, cy, m * 0.25, 0.5 * A * (0.3 + bass), 40);
      } else if (mode === "ribbons") {
        ctx.lineWidth = Math.max(1, k7 * 1.2);
        for (let r = 0; r < 3; r++) {
          for (let j = 0; j < 14; j++) {
            const f = j / 13;
            const v = spec[(r * 14 + j) % BINS];
            ctx.strokeStyle = col(r * 60 + f * 40, (0.15 + 0.5 * v) * A, L + 10);
            ctx.beginPath();
            for (let x = 0; x <= w + 10; x += 10) {
              const u = x / w;
              const y =
                h * (0.3 + r * 0.2) +
                Math.sin(u * 5 + t * (0.6 + r * 0.2) + f * 1.2 + r) * h * (0.08 + bass * 0.08) +
                Math.sin(u * 2.3 - t * 0.4 + r * 2) * h * 0.06 +
                f * h * 0.04;
              if (x === 0) ctx.moveTo(x, y);
              else ctx.lineTo(x, y);
            }
            ctx.stroke();
          }
        }
      } else if (mode === "sunset") {
        const hy = h * 0.6;
        const sky = ctx.createLinearGradient(0, 0, 0, hy);
        sky.addColorStop(0, hsl(260, 0.85 * A, 22, 60));
        sky.addColorStop(0.6, hsl(330, 0.85 * A, 45, 70));
        sky.addColorStop(1, hsl(25, 0.9 * A, 60, 95));
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, w, hy);
        const sea = ctx.createLinearGradient(0, hy, 0, h);
        sea.addColorStop(0, hsl(300, 0.85 * A, 30, 50));
        sea.addColorStop(1, hsl(240, 0.9 * A, 12, 50));
        ctx.fillStyle = sea;
        ctx.fillRect(0, hy, w, h - hy);
        const sr = m * (0.14 + bass * 0.03);
        glowAbs(w / 2, hy, sr * 3.5, 0.45 * A, 30, 65);
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, 0, w, hy);
        ctx.clip();
        ctx.fillStyle = hsl(40, A, 70, 100);
        ctx.beginPath();
        ctx.arc(w / 2, hy + sr * 0.25, sr, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        for (let i = 0; i < 22; i++) {
          const f = i / 22;
          const y = hy + (h - hy) * Math.pow(f, 1.4) + 3;
          const v = spec[Math.floor(f * (BINS - 1))];
          const half = sr * (1.1 - f * 0.5) * (0.6 + v * 0.9) * (0.8 + 0.2 * Math.sin(t * 3 + i));
          ctx.fillStyle = hsl(35, (0.7 - f * 0.5) * A, 70, 100);
          ctx.fillRect(w / 2 - half + Math.sin(t * 2 + i * 1.3) * sr * 0.15, y, half * 2, Math.max(1.5, 3 * k7 * (1 - f * 0.5)));
        }
      } else if (mode === "lava") {
        const bl = once("lava", () =>
          Array.from({ length: 9 }, (_, i) => ({ x: rand(0.2, 0.8), p: rand(0, 6.28), s: rand(0.05, 0.12), r: rand(0.08, 0.16), dh: i * 25 }))
        );
        for (const o of bl) {
          o.p += dt * o.s * (0.6 + bass * 1.2);
          const y = (0.5 + 0.42 * Math.sin(o.p)) * h;
          const x = (o.x + 0.06 * Math.sin(o.p * 1.7)) * w;
          const r = o.r * m * (1 + 0.15 * Math.sin(o.p * 2.3) + bass * 0.2);
          const g = ctx.createRadialGradient(x, y, 0, x, y, r);
          g.addColorStop(0, col(o.dh, 0.85 * A, L + 12));
          g.addColorStop(0.55, col(o.dh, 0.6 * A, L));
          g.addColorStop(1, col(o.dh, 0, L));
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(x, y, r, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (mode === "ripples") {
        const rp = once("ripples", () => []);
        if ((beat || Math.random() < dt * 0.8) && rp.length < 40) rp.push({ x: Math.random() * w, y: Math.random() * h, r: 0, dh: rand(-30, 60), s: rand(0.8, 1.2) });
        const maxR = m * 0.45;
        ctx.lineWidth = Math.max(1, 1.5 * k7);
        for (let i = rp.length - 1; i >= 0; i--) {
          const o = rp[i];
          o.r += dt * m * 0.12 * o.s * (0.7 + bass);
          const a = 1 - o.r / maxR;
          if (a <= 0) {
            rp.splice(i, 1);
            continue;
          }
          for (let j = 0; j < 3; j++) {
            const rr = o.r - j * m * 0.025;
            if (rr <= 0) continue;
            ctx.strokeStyle = col(o.dh, a * (0.7 - j * 0.2) * A, L + 10);
            ctx.beginPath();
            ctx.arc(o.x, o.y, rr, 0, Math.PI * 2);
            ctx.stroke();
          }
        }
      } else if (mode === "orbits") {
        const cx = w / 2, cy = h / 2;
        const sun = m * (0.06 + bass * 0.02);
        glowAt(cx, cy, sun * 5, 0.5 * A * (0.5 + bass), 30);
        ctx.fillStyle = col(30, A, 70);
        ctx.beginPath();
        ctx.arc(cx, cy, sun, 0, Math.PI * 2);
        ctx.fill();
        const pl = once("planets", () =>
          Array.from({ length: 6 }, (_, i) => ({ a: rand(0, 6.28), d: 0.14 + i * 0.065, s: 0.9 / Math.pow(i + 1, 0.9), r: rand(0.008, 0.02), dh: i * 50 }))
        );
        ctx.lineWidth = 1;
        for (const p of pl) {
          p.a += dt * p.s * (0.4 + bass * 0.8);
          const rx = p.d * Math.min(w, h * 2) * 0.95, ry = rx * 0.42;
          ctx.strokeStyle = col(p.dh, 0.2 * A, L);
          ctx.beginPath();
          ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
          ctx.stroke();
          const x = cx + Math.cos(p.a) * rx, y = cy + Math.sin(p.a) * ry;
          const v = spec[Math.floor(p.d * 60) % BINS];
          const r = p.r * m * (1 + v * 0.6) + 1.5;
          glowAt(x, y, r * 4, 0.4 * A * (0.3 + v), p.dh);
          ctx.fillStyle = col(p.dh, A, L + 15);
          ctx.beginPath();
          ctx.arc(x, y, r, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (mode === "rain") {
        const drops = once("rain", () => Array.from({ length: 160 }, () => ({ x: Math.random(), y: Math.random(), l: rand(0.02, 0.045), s: rand(0.35, 0.6) })));
        const splash = once("splash", () => []);
        const wind = Math.sin(ts * 0.15) * 0.1;
        ctx.lineWidth = Math.max(1, k7);
        ctx.strokeStyle = hsl(205, 0.55 * A, dark ? 75 : 45, 60);
        ctx.beginPath();
        for (const d of drops) {
          d.y += dt * d.s * (0.8 + bass * 0.3);
          d.x += dt * wind * 0.3;
          if (d.y > 1) {
            if (splash.length < 120 && Math.random() < 0.5) splash.push({ x: (((d.x % 1) + 1) % 1) * w, r: 0, a: 1 });
            d.y = -d.l;
            d.x = Math.random();
          }
          const x = (((d.x % 1) + 1) % 1) * w, y = d.y * h, len = d.l * h;
          ctx.moveTo(x, y);
          ctx.lineTo(x + wind * len, y + len);
        }
        ctx.stroke();
        for (let i = splash.length - 1; i >= 0; i--) {
          const s = splash[i];
          s.r += dt * 22 * k7;
          s.a -= dt * 1.4;
          if (s.a <= 0) {
            splash.splice(i, 1);
            continue;
          }
          ctx.strokeStyle = hsl(205, s.a * 0.5 * A, dark ? 75 : 45, 60);
          ctx.beginPath();
          ctx.ellipse(s.x, h - 4, s.r, s.r * 0.3, 0, Math.PI, 0);
          ctx.stroke();
        }
      } else if (mode === "snow") {
        const fl = once("snow", () => Array.from({ length: 180 }, () => ({ x: Math.random(), y: Math.random(), z: rand(0.3, 1), p: rand(0, 6.28) })));
        const gust = once("gust", () => ({ v: 0 }));
        if (beat) gust.v = 0.06;
        gust.v *= 1 - Math.min(1, dt * 0.8);
        for (const f of fl) {
          f.y += dt * 0.03 * f.z * (0.8 + bass * 0.3);
          f.x += dt * (Math.sin(ts * 0.4 + f.p) * 0.012 + gust.v * f.z);
          if (f.y > 1.02) {
            f.y = -0.02;
            f.x = Math.random();
          }
          f.x = ((f.x % 1) + 1) % 1;
          ctx.fillStyle = dark ? `rgba(255,255,255,${(0.3 + 0.7 * f.z) * A})` : hsl(210, (0.3 + 0.6 * f.z) * A, 70, 60);
          ctx.beginPath();
          ctx.arc(f.x * w, f.y * h, (1 + f.z * 3) * k7, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (mode === "campfire") {
        const cx = w / 2, by = h * 0.85;
        glowAbs(cx, by, m * (0.6 + bass * 0.3), 0.35 * A * (0.6 + bass), 25, 55);
        const fl = once("flames", () => []);
        const n = Math.round(dt * 160 * (0.7 + bass * 0.4) + Math.random() * 0.5);
        for (let i = 0; i < n && fl.length < 500; i++)
          fl.push({ x: cx + rand(-1, 1) * m * 0.09, y: by, vx: rand(-8, 8) * k7, vy: -rand(35, 75) * k7 * (0.9 + bass * 0.3), life: 1, r: rand(9, 20) * k7, ember: false });
        if (beat || Math.random() < dt * 1.5)
          for (let i = 0; i < 6 && fl.length < 560; i++)
            fl.push({ x: cx + rand(-1, 1) * m * 0.05, y: by, vx: rand(-25, 25) * k7, vy: -rand(50, 110) * k7, life: 1, r: rand(1.2, 2.5) * k7, ember: true });
        for (let i = fl.length - 1; i >= 0; i--) {
          const p = fl[i];
          p.life -= dt * (p.ember ? 0.3 : 0.9);
          if (p.life <= 0) {
            fl.splice(i, 1);
            continue;
          }
          p.x += p.vx * dt + (p.ember ? 0 : (cx - p.x) * dt * 1.5);
          p.y += p.vy * dt;
          ctx.beginPath();
          if (p.ember) {
            ctx.fillStyle = hsl(35, p.life * A, 65, 100);
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          } else {
            const rr = p.r * p.life + 1;
            const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, rr);
            g.addColorStop(0, hsl(10 + p.life * 35, 0.5 * p.life * A, 55 + p.life * 15, 100));
            g.addColorStop(1, hsl(10 + p.life * 35, 0, 50, 100));
            ctx.fillStyle = g;
            ctx.arc(p.x, p.y, rr, 0, Math.PI * 2);
          }
          ctx.fill();
        }
        ctx.globalCompositeOperation = "source-over";
        ctx.strokeStyle = `rgba(70,40,25,${0.95 * A})`;
        ctx.lineWidth = m * 0.028;
        ctx.beginPath();
        ctx.moveTo(cx - m * 0.14, by + m * 0.05);
        ctx.lineTo(cx + m * 0.12, by - m * 0.005);
        ctx.moveTo(cx + m * 0.14, by + m * 0.05);
        ctx.lineTo(cx - m * 0.12, by - m * 0.005);
        ctx.stroke();
      } else if (mode === "kaleido") {
        const cx = w / 2, cy = h / 2, seg = 12, R = Math.hypot(w, h) / 2;
        for (let s = 0; s < seg; s++) {
          ctx.save();
          ctx.translate(cx, cy);
          ctx.rotate((s / seg) * Math.PI * 2 + t * 0.15);
          if (s % 2) ctx.scale(1, -1);
          for (let i = 0; i < 7; i++) {
            const v = spec[i * 8];
            const d = R * (0.08 + i * 0.12) * (1 + 0.1 * Math.sin(t * 1.3 + i));
            const a = 0.12 + 0.1 * Math.sin(t * 0.9 + i * 2);
            const r = m * (0.015 + v * 0.05);
            const x = Math.cos(a) * d, y = Math.sin(a) * d;
            ctx.fillStyle = col(i * 45 + t * 20, (0.35 + 0.6 * v) * A, L + 8);
            ctx.beginPath();
            if (i % 2) ctx.arc(x, y, r, 0, Math.PI * 2);
            else {
              ctx.moveTo(x, y - r);
              ctx.lineTo(x + r, y + r * 0.8);
              ctx.lineTo(x - r, y + r * 0.8);
              ctx.closePath();
            }
            ctx.fill();
          }
          ctx.restore();
        }
        glowAt(cx, cy, m * (0.2 + bass * 0.3), 0.5 * A * (0.3 + bass), 20);
      } else if (mode === "spotlights") {
        const st = once("spots", () => ({ shift: 0 }));
        if (beat) st.shift++;
        const n = 5;
        for (let i = 0; i < n; i++) {
          const ox = (w * (i + 0.5)) / n, oy = -10;
          const fx = ox + Math.sin(t * (0.8 + i * 0.17) + i * 1.9) * w * 0.18, fy = h * 0.82;
          const hh = st.shift * 67 + i * 72;
          const sw = m * (0.09 + bass * 0.04);
          const g = ctx.createLinearGradient(ox, oy, fx, fy);
          g.addColorStop(0, hsl(hh, 0.5 * A * (0.6 + flash * 0.4), 65));
          g.addColorStop(1, hsl(hh, 0.08 * A, 65));
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.moveTo(ox - 4, oy);
          ctx.lineTo(ox + 4, oy);
          ctx.lineTo(fx + sw, fy);
          ctx.lineTo(fx - sw, fy);
          ctx.closePath();
          ctx.fill();
          const eg = ctx.createRadialGradient(fx, fy, 0, fx, fy, sw * 1.3);
          eg.addColorStop(0, hsl(hh, 0.6 * A, 70));
          eg.addColorStop(1, hsl(hh, 0, 70));
          ctx.fillStyle = eg;
          ctx.beginPath();
          ctx.ellipse(fx, fy, sw * 1.3, sw * 0.35, 0, 0, Math.PI * 2);
          ctx.fill();
        }
        // the crowd
        ctx.globalCompositeOperation = "source-over";
        ctx.fillStyle = dark ? "rgba(0,0,0,0.92)" : `rgba(20,20,30,${0.85 * A})`;
        const hr = 9 * k7;
        const people = Math.ceil(w / (hr * 3));
        ctx.beginPath();
        for (let i = 0; i <= people; i++) {
          const x = (i / people) * w + Math.sin(i * 7.3) * hr;
          const jump = Math.max(0, Math.sin(t * 6 + i * 1.7)) * (4 + bass * 14) * k7 * (i % 3 === 0 ? 1 : 0.5);
          const y = h * 0.86 - jump - (Math.sin(i * 3.1) + 1) * 6 * k7;
          ctx.moveTo(x + hr, y);
          ctx.arc(x, y, hr, 0, Math.PI * 2);
          ctx.rect(x - hr * 1.5, y + hr * 0.9, hr * 3, h);
          if (i % 4 === 1 && Math.sin(t * 3 + i) > 0.4 - bass) ctx.rect(x + hr * 0.9, y - hr * 2.4, hr * 0.6, hr * 3.6);
        }
        ctx.fill();
      } else if (mode === "fireworks") {
        const fw = once("fw", () => ({ rockets: [], sparks: [] }));
        if ((beat || Math.random() < dt * 0.9 * energy) && fw.rockets.length < 6)
          fw.rockets.push({ x: rand(0.15, 0.85) * w, y: h, vy: -rand(0.9, 1.25) * h, ty: rand(0.15, 0.45) * h, hh: rand(0, 360) });
        for (let i = fw.rockets.length - 1; i >= 0; i--) {
          const r = fw.rockets[i];
          r.y += r.vy * dt;
          r.vy *= 1 - Math.min(1, dt * 0.8);
          ctx.fillStyle = hsl(40, A, 80, 80);
          ctx.beginPath();
          ctx.arc(r.x, r.y, 2 * k7, 0, Math.PI * 2);
          ctx.fill();
          if (r.y <= r.ty || r.vy > -h * 0.2) {
            const sp = rand(0.25, 0.4) * m;
            for (let j = 0; j < 70; j++) {
              const a = (j / 70) * Math.PI * 2, s = sp * rand(0.6, 1);
              fw.sparks.push({ x: r.x, y: r.y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 1, hh: r.hh + rand(-20, 20) });
            }
            fw.rockets.splice(i, 1);
          }
        }
        ctx.lineWidth = Math.max(1, 1.8 * k7);
        for (let i = fw.sparks.length - 1; i >= 0; i--) {
          const s = fw.sparks[i];
          s.vy += m * 0.25 * dt;
          s.vx *= 1 - Math.min(1, dt * 1.2);
          s.vy *= 1 - Math.min(1, dt * 1.2);
          s.x += s.vx * dt;
          s.y += s.vy * dt;
          s.life -= dt * 0.6;
          if (s.life <= 0) {
            fw.sparks.splice(i, 1);
            continue;
          }
          ctx.strokeStyle = hsl(s.hh, s.life * A, 65, 100);
          ctx.beginPath();
          ctx.moveTo(s.x - s.vx * 0.05, s.y - s.vy * 0.05);
          ctx.lineTo(s.x, s.y);
          ctx.stroke();
        }
      } else if (mode === "sparkle") {
        const gl = once("glitter", () =>
          Array.from({ length: 120 }, () => ({ x: Math.random(), y: Math.random(), p: rand(0, 6.28), sp: rand(1.5, 4), b: Math.floor(rand(0, 48)), hh: rand(0, 360) }))
        );
        const burst = once("gburst", () => []);
        if (beat)
          for (let i = 0; i < 30 && burst.length < 300; i++) {
            const a = rand(0, 6.28), s = rand(0.1, 0.4) * m;
            burst.push({ x: w / 2, y: h / 2, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 1, hh: rand(0, 360) });
          }
        for (const g of gl) {
          const tw = Math.pow(0.5 + 0.5 * Math.sin(t * g.sp + g.p), 3);
          ctx.fillStyle = hsl(g.hh + t * 20, (0.2 + 0.8 * tw) * A, dark ? 75 : 55, 90);
          ctx.beginPath();
          twinkle(ctx, g.x * w, g.y * h, (2 + tw * 8 + spec[g.b] * 6) * k7);
          ctx.fill();
        }
        for (let i = burst.length - 1; i >= 0; i--) {
          const s = burst[i];
          s.x += s.vx * dt;
          s.y += s.vy * dt;
          s.life -= dt * 0.8;
          if (s.life <= 0) {
            burst.splice(i, 1);
            continue;
          }
          ctx.fillStyle = hsl(s.hh, s.life * A, dark ? 75 : 55, 90);
          ctx.beginPath();
          twinkle(ctx, s.x, s.y, 7 * k7 * s.life);
          ctx.fill();
        }
      } else if (mode === "lanterns") {
        const sky = ctx.createLinearGradient(0, 0, 0, h);
        sky.addColorStop(0, `rgba(12,14,40,${dark ? 0.9 : 0.8})`);
        sky.addColorStop(1, `rgba(70,35,70,${dark ? 0.9 : 0.8})`);
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, w, h);
        const ln = once("lanterns", () =>
          Array.from({ length: 22 }, () => ({ x: Math.random(), y: rand(0, 1.3), z: rand(0.35, 1), p: rand(0, 6.28) })).sort((a, b) => a.z - b.z)
        );
        for (const o of ln) {
          o.y -= dt * 0.035 * o.z * (0.6 + bass * 1.2);
          if (o.y < -0.1) {
            o.y = 1.1;
            o.x = Math.random();
          }
          const x = (o.x + Math.sin(t * 0.4 + o.p) * 0.02) * w, y = o.y * h, s = m * 0.035 * o.z;
          const fl = Math.min(1.2, 0.85 + 0.15 * Math.sin(ts * 6 + o.p) + 0.2 * bass);
          glowAbs(x, y, s * 4, 0.25 * fl * o.z * A, 30, 60, 95);
          const g = ctx.createLinearGradient(0, y - s, 0, y + s);
          g.addColorStop(0, hsl(20, 0.9 * A * o.z, 45, 90));
          g.addColorStop(1, hsl(42, A * o.z, 60 + 12 * fl, 100));
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.moveTo(x - s * 0.6, y - s);
          ctx.lineTo(x + s * 0.6, y - s);
          ctx.lineTo(x + s * 0.45, y + s);
          ctx.lineTo(x - s * 0.45, y + s);
          ctx.closePath();
          ctx.fill();
        }
      } else if (mode === "ledwall") {
        const cell = Math.max(10, 18 * k7);
        const nx = Math.ceil(w / cell), ny = Math.ceil(h / cell);
        const rip = once("ledRip", () => ({ r: 9 }));
        if (beat) rip.r = 0;
        rip.r += dt * 1.5;
        for (let x = 0; x < nx; x++) {
          const k = Math.abs(x - (nx - 1) / 2) / (nx / 2);
          const lit = spec[Math.min(BINS - 1, Math.floor(k * BINS * 0.9))] * ny * 0.85;
          for (let y = 0; y < ny; y++) {
            const d = Math.hypot(x - nx / 2, y - ny / 2) / Math.max(nx, ny);
            const ring = Math.max(0, 1 - Math.abs(d - rip.r) * 10);
            const on = ny - y <= lit ? 1 : 0;
            const a = Math.max(on * 0.95, ring * 0.7, 0.06);
            ctx.fillStyle = col(k * 120 + y * 3 + ring * 60, a * A, on || ring > 0.1 ? L + 10 : 30);
            ctx.beginPath();
            ctx.arc(x * cell + cell / 2, y * cell + cell / 2, cell * 0.32, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      } else if (mode === "vortex") {
        const cx = w / 2, cy = h / 2, R = Math.hypot(w, h) / 2;
        const vz = once("vortex", () => ({ z: 0 }));
        vz.z = (vz.z + dt * (0.12 + bass * 0.5)) % 1;
        const arms = 6, per = 60;
        for (let a = 0; a < arms; a++) {
          for (let i = 0; i < per; i++) {
            const p = 1 - ((i / per + vz.z) % 1); // flows inward
            const r = Math.pow(p, 1.6) * R;
            const ang = a * ((Math.PI * 2) / arms) + p * 5 - t * 0.8;
            const v = spec[Math.floor(p * (BINS - 1))];
            ctx.fillStyle = col(a * 60 + p * 80, Math.min(1, (0.2 + 0.8 * p) * (0.5 + v)) * A, L + 10);
            ctx.beginPath();
            ctx.arc(cx + Math.cos(ang) * r, cy + Math.sin(ang) * r, (0.5 + p * 4 + v * 3) * k7, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        glowAt(cx, cy, m * (0.15 + bass * 0.2), 0.6 * A * (0.3 + bass), 40);
      } else if (mode === "matrix") {
        const fs = Math.max(10, 16 * k7);
        const nx = Math.ceil(w / fs);
        const mx = once("matrix", () => ({ drops: [], chars: "01アイウエオカキクケコサシスセソタチツテト<>{}[]#$%&*+=" }));
        while (mx.drops.length < nx) mx.drops.push({ y: rand(-40, 0), s: rand(6, 14), len: Math.floor(rand(8, 24)) });
        ctx.font = `${fs}px ui-monospace, monospace`;
        ctx.textAlign = "center";
        for (let i = 0; i < nx; i++) {
          const d = mx.drops[i];
          const v = spec[Math.floor((Math.abs(i - nx / 2) / (nx / 2)) * (BINS - 1))];
          d.y += dt * d.s * (0.6 + bass * 1.5 + v);
          if ((d.y - d.len) * fs > h) {
            d.y = rand(-10, 0);
            d.len = Math.floor(rand(8, 24));
          }
          const head = Math.floor(d.y);
          for (let j = 0; j < d.len; j++) {
            const row = head - j;
            if (row < 0) break;
            if (row * fs > h + fs) continue;
            const ch = mx.chars[(row * 7 + i * 13 + Math.floor(t * 4 + i)) % mx.chars.length];
            ctx.fillStyle = j === 0 ? (dark ? `rgba(220,255,230,${A})` : hsl(140, A, 25, 80)) : hsl(140, (1 - j / d.len) * 0.8 * A, dark ? 50 : 35, 90);
            ctx.fillText(ch, i * fs + fs / 2, row * fs);
          }
        }
      } else if (mode === "pixel") {
        const pk = once("peaks", () => []);
        const n = w < 400 ? 16 : 32, cw = w / n, bh = Math.max(5, h / 40);
        const rows = Math.floor((h * 0.85) / bh);
        for (let i = 0; i < n; i++) {
          const v = spec[Math.min(BINS - 1, Math.floor(Math.pow(i / n, 1.3) * BINS * 0.95))];
          const lit = Math.round(v * rows);
          pk[i] = Math.max(lit, (pk[i] ?? 0) - dt * rows * 0.6);
          for (let r = 0; r < rows; r++) {
            const on = r < lit;
            const f = r / rows;
            ctx.fillStyle = hsl(f < 0.55 ? 120 : f < 0.8 ? 55 : 0, on ? A : 0.07 * A, on ? 55 : 40, 95);
            ctx.fillRect(i * cw + cw * 0.12, h - (r + 1) * bh, cw * 0.76, bh * 0.7);
          }
          ctx.fillStyle = hsl(0, 0.9 * A, dark ? 95 : 20, 0);
          ctx.fillRect(i * cw + cw * 0.12, h - (Math.max(Math.floor(pk[i]), lit) + 1) * bh, cw * 0.76, bh * 0.7);
        }
      } else if (mode === "plasma") {
        const W = 80, H = 45;
        const pc = once("plasma", () => {
          const c = document.createElement("canvas");
          c.width = W;
          c.height = H;
          const x = c.getContext("2d");
          return { c, x, img: x.createImageData(W, H) };
        });
        const d = pc.img.data, tt = t * 0.8, amp = 1 + bass * 1.5, ph = (hue / 360) * Math.PI * 2, al = 255 * A * 0.85;
        for (let y = 0; y < H; y++) {
          for (let x = 0; x < W; x++) {
            const u = (x / W) * 6, vv = (y / H) * 4;
            const val =
              Math.sin(u + tt) +
              Math.sin(vv * 1.3 - tt * 1.2) +
              Math.sin((u + vv + tt) * 0.7) +
              Math.sin(Math.hypot(u - 3 + Math.sin(tt * 0.5) * 2, vv - 2 + Math.cos(tt * 0.4)) * amp * 1.5);
            const k = val * Math.PI * 0.5 + ph;
            const i4 = (y * W + x) * 4;
            d[i4] = 128 + 127 * Math.sin(k);
            d[i4 + 1] = 128 + 127 * Math.sin(k + 2.09);
            d[i4 + 2] = 128 + 127 * Math.sin(k + 4.19);
            d[i4 + 3] = al;
          }
        }
        pc.x.putImageData(pc.img, 0, 0);
        ctx.imageSmoothingEnabled = true;
        ctx.drawImage(pc.c, 0, 0, w, h);
      } else if (mode === "hearts") {
        const hs = once("hearts", () =>
          Array.from({ length: 30 }, () => ({ x: Math.random(), y: Math.random() * 1.2, r: rand(0.015, 0.05), s: rand(0.03, 0.08), p: rand(0, 6.28), hh: rand(320, 370), b: Math.floor(rand(0, 40)) }))
        );
        for (const o of hs) {
          o.y -= dt * o.s * (0.6 + bass * 1.5);
          if (o.y < -0.1) {
            o.y = 1.1;
            o.x = Math.random();
          }
          const v = spec[o.b];
          ctx.fillStyle = hsl(o.hh, (0.5 + 0.4 * v) * A, 62, 90);
          ctx.beginPath();
          heart(ctx, (o.x + Math.sin(t + o.p) * 0.03) * w, o.y * h, o.r * m * (1 + v * 0.5 + flash * 0.15));
          ctx.fill();
        }
        const R = m * (0.12 + bass * 0.05 + flash * 0.02);
        glowAbs(w / 2, h / 2, R * 3, 0.4 * A, 345, 60);
        ctx.fillStyle = hsl(345, 0.85 * A, 58, 90);
        ctx.beginPath();
        heart(ctx, w / 2, h / 2, R);
        ctx.fill();
      } else if (mode === "petals") {
        glowAbs(w / 2, h * 0.3, Math.max(w, h) * 0.7, 0.25 * A, 345, 55, 70);
        const ps = once("petals", () =>
          Array.from({ length: 45 }, () => ({
            x: Math.random(), y: Math.random(), r: rand(0.012, 0.025), s: rand(0.04, 0.09), rot: rand(0, 6.28), vr: rand(-1.5, 1.5), p: rand(0, 6.28), hh: rand(335, 365), l: rand(55, 72),
          }))
        );
        for (const o of ps) {
          o.y += dt * o.s * (0.6 + bass * 1.2);
          o.x += dt * (Math.sin(t * 0.8 + o.p) * 0.04 + 0.01);
          o.rot += o.vr * dt * (1 + bass);
          if (o.y > 1.05) {
            o.y = -0.05;
            o.x = Math.random();
          }
          if (o.x > 1.05) o.x = -0.05;
          const r = o.r * m;
          ctx.save();
          ctx.translate(o.x * w, o.y * h);
          ctx.rotate(o.rot);
          ctx.scale(1, 0.4 + 0.6 * Math.abs(Math.sin(t * 2 + o.p)));
          ctx.fillStyle = hsl(o.hh, 0.9 * A, o.l, 80);
          ctx.beginPath();
          ctx.moveTo(0, -r);
          ctx.bezierCurveTo(r * 1.1, -r * 0.6, r * 0.8, r * 0.9, 0, r);
          ctx.bezierCurveTo(-r * 0.8, r * 0.9, -r * 1.1, -r * 0.6, 0, -r);
          ctx.fill();
          ctx.restore();
        }
      } else if (mode === "candles") {
        const bk = once("bokeh", () => Array.from({ length: 18 }, () => ({ x: Math.random(), y: Math.random() * 0.7, r: rand(0.03, 0.09), p: rand(0, 6.28) })));
        for (const o of bk) glowAbs(o.x * w + Math.sin(ts * 0.1 + o.p) * 20, o.y * h, o.r * m, (0.12 + 0.08 * Math.sin(ts * 0.5 + o.p) + 0.1 * bass) * A, 35, 65, 90);
        const n = 5, cw = m * 0.05;
        for (let i = 0; i < n; i++) {
          const x = w * (0.2 + i * 0.15);
          const top = h - h * (0.18 + ((i * 7) % 3) * 0.07);
          const v = spec[i * 6];
          const fl = Math.sin(ts * 9 + i * 2) * 0.08 + Math.sin(ts * 23 + i) * 0.05;
          glowAbs(x, top - cw * 0.6, m * (0.18 + v * 0.1), (0.35 + 0.2 * v) * A, 32, 60, 95);
          const g = ctx.createLinearGradient(x - cw / 2, 0, x + cw / 2, 0);
          g.addColorStop(0, `rgba(240,225,200,${A})`);
          g.addColorStop(1, `rgba(190,165,140,${A})`);
          ctx.fillStyle = g;
          ctx.fillRect(x - cw / 2, top, cw, h - top);
          const fh = cw * (1.1 + v * 0.6 + fl), fw = cw * 0.32;
          ctx.save();
          ctx.translate(x, top - cw * 0.08);
          ctx.rotate(fl * 0.6);
          const fg = ctx.createRadialGradient(0, -fh * 0.3, 0, 0, -fh * 0.3, fh);
          fg.addColorStop(0, `rgba(255,250,220,${A})`);
          fg.addColorStop(0.4, `rgba(255,190,80,${A})`);
          fg.addColorStop(1, "rgba(255,120,30,0)");
          ctx.fillStyle = fg;
          ctx.beginPath();
          ctx.moveTo(0, -fh);
          ctx.quadraticCurveTo(fw, -fh * 0.3, 0, 0);
          ctx.quadraticCurveTo(-fw, -fh * 0.3, 0, -fh);
          ctx.fill();
          ctx.restore();
        }
      } else if (mode === "aquarium") {
        const water = ctx.createLinearGradient(0, 0, 0, h);
        water.addColorStop(0, hsl(195, 0.75 * A, 55, 80));
        water.addColorStop(1, hsl(215, 0.85 * A, 28, 80));
        ctx.fillStyle = water;
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = hsl(40, 0.9 * A, 70, 60);
        ctx.beginPath();
        ctx.moveTo(0, h);
        for (let x = 0; x <= w + 20; x += 20) ctx.lineTo(x, h * 0.92 + Math.sin(x * 0.02) * h * 0.015);
        ctx.lineTo(w, h);
        ctx.fill();
        ctx.lineWidth = 6 * k7;
        for (let i = 0; i < 7; i++) {
          const x0 = (w * (i + 0.5)) / 7 + Math.sin(i * 5.1) * w * 0.04, len = h * (0.2 + ((i * 37) % 10) / 40);
          ctx.strokeStyle = hsl(120 + i * 8, 0.85 * A, 38, 60);
          ctx.beginPath();
          ctx.moveTo(x0, h * 0.95);
          for (let s = 1; s <= 8; s++) {
            const f = s / 8;
            ctx.lineTo(x0 + Math.sin(t * 1.2 + f * 3 + i) * f * 20 * k7 * (1 + bass), h * 0.95 - len * f);
          }
          ctx.stroke();
        }
        const fish = once("fish", () =>
          Array.from({ length: 9 }, (_, i) => ({ x: Math.random(), y: rand(0.15, 0.8), s: rand(0.04, 0.09) * (Math.random() < 0.5 ? -1 : 1), r: rand(0.035, 0.06), c: KIDS[i % KIDS.length], p: rand(0, 6.28) }))
        );
        for (const f of fish) {
          f.x += f.s * dt * (0.6 + bass * 1.5);
          if (f.x > 1.15) f.s = -Math.abs(f.s);
          if (f.x < -0.15) f.s = Math.abs(f.s);
          const r = f.r * m * (1 + bass * 0.1);
          const wag = Math.sin(t * 8 + f.p) * 0.25;
          ctx.save();
          ctx.translate(f.x * w, (f.y + Math.sin(t * 1.5 + f.p) * 0.02) * h);
          ctx.scale(Math.sign(f.s), 1);
          ctx.fillStyle = hsl(f.c, A, 60);
          ctx.beginPath();
          ctx.moveTo(-r * 0.8, 0);
          ctx.lineTo(-r * 1.5, -r * 0.6 + wag * r);
          ctx.lineTo(-r * 1.5, r * 0.6 + wag * r);
          ctx.closePath();
          ctx.fill();
          ctx.beginPath();
          ctx.ellipse(0, 0, r, r * 0.62, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = `rgba(255,255,255,${A})`;
          ctx.beginPath();
          ctx.arc(r * 0.5, -r * 0.15, r * 0.18, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = `rgba(20,20,40,${A})`;
          ctx.beginPath();
          ctx.arc(r * 0.55, -r * 0.15, r * 0.09, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
        const bub = once("aqBub", () => Array.from({ length: 25 }, () => ({ x: Math.random(), y: Math.random(), r: rand(2, 6), s: rand(0.05, 0.12) })));
        ctx.strokeStyle = `rgba(255,255,255,${0.6 * A})`;
        ctx.lineWidth = 1.2;
        for (const b of bub) {
          b.y -= dt * b.s * (0.7 + bass * 2);
          if (b.y < -0.05) {
            b.y = 1;
            b.x = Math.random();
          }
          ctx.beginPath();
          ctx.arc(b.x * w + Math.sin(t * 2 + b.r) * 4, b.y * h, b.r * k7, 0, Math.PI * 2);
          ctx.stroke();
        }
      } else if (mode === "butterflies") {
        for (let i = 0; i < 9; i++) {
          const x = (w * (i + 0.5)) / 9, v = spec[i * 5];
          const y = h * (0.88 - v * 0.05), r = m * 0.028 * (1 + v * 0.4);
          ctx.strokeStyle = hsl(120, 0.8 * A, 40, 60);
          ctx.lineWidth = 3 * k7;
          ctx.beginPath();
          ctx.moveTo(x, h);
          ctx.lineTo(x, y);
          ctx.stroke();
          ctx.fillStyle = hsl(KIDS[i % KIDS.length], 0.95 * A, 65);
          ctx.beginPath();
          for (let p = 0; p < 5; p++) {
            const a = (p / 5) * Math.PI * 2 + t * 0.3;
            ctx.moveTo(x + Math.cos(a) * r + r * 0.7, y + Math.sin(a) * r);
            ctx.arc(x + Math.cos(a) * r, y + Math.sin(a) * r, r * 0.7, 0, Math.PI * 2);
          }
          ctx.fill();
          ctx.fillStyle = hsl(50, A, 60);
          ctx.beginPath();
          ctx.arc(x, y, r * 0.55, 0, Math.PI * 2);
          ctx.fill();
        }
        const bf = once("bfly", () =>
          Array.from({ length: 10 }, (_, i) => ({ x: Math.random(), y: rand(0.08, 0.75), a: rand(0, 6.28), c: KIDS[(i * 3) % KIDS.length], r: rand(0.03, 0.05), p: rand(0, 6.28) }))
        );
        for (const b of bf) {
          b.a += Math.sin(t * 0.7 + b.p) * 1.2 * dt;
          const sp = 0.06 * (0.6 + bass * 1.5);
          b.x += Math.cos(b.a) * sp * dt;
          b.y += Math.sin(b.a) * sp * dt * 0.7;
          if (b.x < -0.05) b.x = 1.05;
          if (b.x > 1.05) b.x = -0.05;
          if (b.y < 0.05 || b.y > 0.78) {
            b.a = -b.a;
            b.y = Math.min(0.78, Math.max(0.05, b.y));
          }
          const r = b.r * m, flap = 0.25 + 0.75 * Math.abs(Math.sin(ts * (9 + bass * 8) + b.p));
          ctx.save();
          ctx.translate(b.x * w, b.y * h);
          ctx.rotate(Math.sin(t + b.p) * 0.2);
          ctx.fillStyle = hsl(b.c, 0.9 * A, 62);
          for (const sx of [-1, 1]) {
            ctx.beginPath();
            ctx.ellipse(sx * r * 0.55 * flap, -r * 0.3, r * 0.6 * flap, r * 0.75, sx * 0.4, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.ellipse(sx * r * 0.4 * flap, r * 0.45, r * 0.4 * flap, r * 0.5, -sx * 0.4, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.fillStyle = `rgba(40,30,40,${A})`;
          ctx.fillRect(-r * 0.08, -r * 0.7, r * 0.16, r * 1.4);
          ctx.restore();
        }
      } else if (mode === "mobile") {
        const bgS = ctx.createLinearGradient(0, 0, 0, h);
        bgS.addColorStop(0, `rgba(20,24,56,${dark ? 0.9 : 0.75})`);
        bgS.addColorStop(1, `rgba(50,40,90,${dark ? 0.9 : 0.75})`);
        ctx.fillStyle = bgS;
        ctx.fillRect(0, 0, w, h);
        const cx = w / 2, top = h * 0.08, R = Math.min(w * 0.35, m * 0.5);
        glowAbs(cx, h * 0.5, m * 0.6, 0.12, 260, 70, 50);
        ctx.lineWidth = 1;
        ctx.strokeStyle = "rgba(255,240,220,0.35)";
        ctx.beginPath();
        ctx.moveTo(cx, 0);
        ctx.lineTo(cx, top);
        ctx.stroke();
        ctx.strokeStyle = "rgba(255,240,220,0.3)";
        ctx.beginPath();
        ctx.ellipse(cx, top, R, R * 0.12, 0, 0, Math.PI * 2);
        ctx.stroke();
        const items = [];
        for (let i = 0; i < 6; i++) {
          const a = ts * 0.25 + (i / 6) * Math.PI * 2;
          items.push({ i, x: cx + Math.cos(a) * R, z: Math.sin(a), len: h * (0.28 + (i % 3) * 0.1) });
        }
        items.sort((p, q) => p.z - q.z); // far ones first
        for (const it of items) {
          const ty = top + it.z * R * 0.12;
          const by = ty + it.len + Math.sin(ts * 0.6 + it.i) * h * 0.01;
          const near = (it.z + 1) / 2;
          const sc = (0.75 + 0.25 * near) * m * 0.055;
          const al = 0.55 + 0.4 * near;
          ctx.strokeStyle = `rgba(255,240,220,${0.25 * al})`;
          ctx.beginPath();
          ctx.moveTo(it.x, ty);
          ctx.lineTo(it.x, by - sc);
          ctx.stroke();
          ctx.save();
          ctx.translate(it.x, by);
          ctx.rotate(Math.sin(ts * 0.8 + it.i * 1.3) * 0.15);
          const kind = it.i % 3;
          ctx.fillStyle = [`rgba(253,243,196,${al})`, `rgba(200,210,255,${al})`, `rgba(255,200,220,${al})`][kind];
          ctx.beginPath();
          if (kind === 0) {
            ctx.rect(-sc * 2, -sc * 2, sc * 4, sc * 4);
            ctx.arc(sc * 0.45, -sc * 0.25, sc * 0.85, 0, Math.PI * 2);
            ctx.clip("evenodd");
            ctx.beginPath();
            ctx.arc(0, 0, sc, 0, Math.PI * 2);
          } else if (kind === 1) {
            for (let j = 0; j < 10; j++) {
              const a = (j / 10) * Math.PI * 2 - Math.PI / 2, rr = j % 2 ? sc * 0.45 : sc;
              ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
            }
            ctx.closePath();
          } else {
            for (const [dx, dy, rr] of [[-0.6, 0.15, 0.5], [0, -0.15, 0.65], [0.6, 0.15, 0.5]]) {
              ctx.moveTo(dx * sc + rr * sc, dy * sc);
              ctx.arc(dx * sc, dy * sc, rr * sc, 0, Math.PI * 2);
            }
          }
          ctx.fill();
          ctx.restore();
        }
      } else if (mode === "clouds") {
        const sky = ctx.createLinearGradient(0, 0, 0, h);
        sky.addColorStop(0, `rgba(30,36,80,${dark ? 0.85 : 0.7})`);
        sky.addColorStop(1, `rgba(90,70,120,${dark ? 0.85 : 0.7})`);
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, w, h);
        const st = once("cloudStars", () => Array.from({ length: 50 }, () => ({ x: Math.random(), y: Math.random() * 0.7, p: rand(0, 6.28) })));
        for (const s of st) {
          ctx.fillStyle = `rgba(255,250,235,${0.2 + 0.4 * (0.5 + 0.5 * Math.sin(ts * 0.6 + s.p))})`;
          ctx.beginPath();
          ctx.arc(s.x * w, s.y * h, 1.1 * k7, 0, Math.PI * 2);
          ctx.fill();
        }
        const cl = once("sleepClouds", () => Array.from({ length: 7 }, () => ({ x: rand(-0.2, 1.2), y: rand(0.1, 0.85), s: rand(0.6, 1.3), v: rand(0.006, 0.014) })));
        for (const c of cl) {
          c.x += dt * c.v;
          if (c.x > 1.3) c.x = -0.3;
          const r = m * 0.12 * c.s, x = c.x * w, y = c.y * h + Math.sin(ts * 0.2 + c.s * 5) * h * 0.01;
          for (const [dx, dy, rr] of [[-1, 0.1, 0.7], [-0.35, -0.25, 0.95], [0.45, -0.1, 0.85], [1.05, 0.15, 0.6]]) {
            const px = x + dx * r, py = y + dy * r, pr = rr * r * 1.3;
            const g = ctx.createRadialGradient(px, py, 0, px, py, pr);
            g.addColorStop(0, "rgba(235,225,255,0.22)");
            g.addColorStop(0.6, "rgba(235,225,255,0.12)");
            g.addColorStop(1, "rgba(235,225,255,0)");
            ctx.fillStyle = g;
            ctx.fillRect(px - pr, py - pr, pr * 2, pr * 2);
          }
        }
      } else if (mode === "forest") {
        const sa = dark ? 0.95 : 0.85;
        const sky = ctx.createLinearGradient(0, 0, 0, h);
        sky.addColorStop(0, `rgba(30,62,70,${sa})`);
        sky.addColorStop(0.55, `rgba(110,150,130,${sa})`);
        sky.addColorStop(1, `rgba(40,70,55,${sa})`);
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, w, h);
        // sunbeams through the canopy
        ctx.globalCompositeOperation = "lighter";
        for (let i = 0; i < 5; i++) {
          const x = w * (0.08 + i * 0.2) + Math.sin(ts * 0.05 + i) * w * 0.03;
          const a = (0.05 + 0.03 * Math.sin(ts * 0.25 + i * 1.7) + 0.03 * bass) * A;
          const g = ctx.createLinearGradient(x, 0, x + w * 0.2, h);
          g.addColorStop(0, `rgba(255,240,190,${a})`);
          g.addColorStop(1, "rgba(255,240,190,0)");
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x + w * 0.05, 0);
          ctx.lineTo(x + w * 0.3, h);
          ctx.lineTo(x + w * 0.16, h);
          ctx.fill();
        }
        ctx.globalCompositeOperation = "source-over";
        const layers = once("forestTrees", () =>
          [0, 1, 2].map((l) => {
            const n = 8 + l * 4;
            return Array.from({ length: n }, (_, i) => ({ x: (i + rand(-0.35, 0.35)) / (n - 1), hgt: rand(0.28, 0.45) * (0.75 + l * 0.25), wd: rand(0.07, 0.1), p: rand(0, 6.28) }));
          })
        );
        const tones = [[86, 128, 112], [48, 84, 70], [18, 40, 32]];
        layers.forEach((layer, l) => {
          const [r, g, b] = tones[l];
          const base = h * (0.74 + l * 0.1);
          ctx.fillStyle = `rgba(${r},${g},${b},${A})`;
          ctx.beginPath();
          ctx.rect(0, base - 1, w, h - base + 1);
          for (const tr of layer) {
            const x = tr.x * w, th = tr.hgt * h, tw = tr.wd * h;
            const sway = Math.sin(ts * 0.35 + tr.p) * th * 0.02 * (1 + bass * 0.3);
            ctx.rect(x - tw * 0.07, base - th * 0.16, tw * 0.14, th * 0.17);
            for (let k = 0; k < 3; k++) {
              const bot = base - th * 0.12 - k * th * 0.24, top = bot - th * 0.42, half = tw * (1 - k * 0.24);
              ctx.moveTo(x - half, bot);
              ctx.lineTo(x + (sway * (k + 1)) / 3, top);
              ctx.lineTo(x + half, bot);
              ctx.closePath();
            }
          }
          ctx.fill();
          if (l < 2) {
            // mist between the layers
            const mist = ctx.createLinearGradient(0, base - h * 0.14, 0, base + h * 0.06);
            const ma = (0.16 + 0.06 * Math.sin(ts * 0.2 + l)) * A;
            mist.addColorStop(0, "rgba(220,235,230,0)");
            mist.addColorStop(0.7, `rgba(220,235,230,${ma})`);
            mist.addColorStop(1, "rgba(220,235,230,0)");
            ctx.fillStyle = mist;
            ctx.fillRect(0, base - h * 0.14, w, h * 0.2);
          }
        });
        // drifting pollen in the light
        const motes = once("forestMotes", () => Array.from({ length: 40 }, () => ({ x: Math.random(), y: Math.random(), p: rand(0, 6.28), s: rand(0.005, 0.015) })));
        for (const d of motes) {
          d.y -= dt * d.s;
          if (d.y < -0.02) d.y = 1.02;
          const a = (0.3 + 0.4 * Math.sin(ts * 0.8 + d.p)) * A;
          if (a <= 0) continue;
          ctx.fillStyle = `rgba(255,245,200,${a})`;
          ctx.beginPath();
          ctx.arc((d.x + Math.sin(ts * 0.2 + d.p) * 0.02) * w, d.y * h, 1.6 * k7, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (mode === "blossom") {
        const sa = dark ? 0.92 : 0.82;
        const sky = ctx.createLinearGradient(0, 0, 0, h);
        sky.addColorStop(0, `rgba(120,140,200,${sa})`);
        sky.addColorStop(1, `rgba(250,200,210,${sa})`);
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = `rgba(110,160,100,${A})`;
        ctx.beginPath();
        ctx.ellipse(w / 2, h * 1.08, w * 0.75, h * 0.2, 0, 0, Math.PI * 2);
        ctx.fill();
        const tree = once("blossomTree", () => {
          const grow = (d) => {
            const n = d >= 7 ? 0 : d < 2 ? 2 : Math.random() < 0.3 ? 3 : 2;
            return {
              d, seed: rand(0, 6.28),
              kids: Array.from({ length: n }, (_, i) => ({ off: rand(-0.3, 0.3) + (i - (n - 1) / 2) * 0.6, k: rand(0.68, 0.8), node: grow(d + 1) })),
            };
          };
          return grow(0);
        });
        const tips = [];
        ctx.strokeStyle = `rgba(80,52,48,${A})`;
        const branch = (node, x, y, ang, len) => {
          const a = ang + Math.sin(ts * 0.45 + node.seed) * 0.012 * node.d * (1 + bass * 0.4);
          const x2 = x + Math.cos(a) * len, y2 = y + Math.sin(a) * len;
          ctx.lineWidth = Math.max(1, (8 - node.d) * 2 * k7);
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x2, y2);
          ctx.stroke();
          if (!node.kids.length) tips.push(x2, y2);
          for (const c of node.kids) branch(c.node, x2, y2, a + c.off, len * c.k);
        };
        const trunkX = w / 2, trunkY = h * 0.94;
        branch(tree, trunkX, trunkY, -Math.PI / 2, h * 0.19);
        for (let i = 0; i < tips.length; i += 2) {
          const j = i / 2, v = spec[j % BINS];
          for (let q = 0; q < 3; q++) {
            ctx.fillStyle = `hsla(${340 + ((j * 7 + q * 5) % 20)} 80% ${78 - q * 6}% / ${0.85 * A})`;
            ctx.beginPath();
            ctx.arc(tips[i] + Math.sin(j * 3.1 + q * 2) * 6 * k7, tips[i + 1] + Math.cos(j * 2.3 + q * 2) * 6 * k7, (5 + q * 1.5 + v * 2) * k7, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        const pet = once("blossomPetals", () => Array.from({ length: 35 }, () => ({ x: Math.random(), y: Math.random(), rot: rand(0, 6.28), vr: rand(-1, 1), p: rand(0, 6.28), s: rand(0.015, 0.035) })));
        for (const o of pet) {
          o.y += dt * o.s;
          o.x += dt * (0.008 + Math.sin(ts * 0.5 + o.p) * 0.01);
          o.rot += o.vr * dt;
          if (o.y > 1.03 || o.x > 1.03) {
            o.y = rand(0.15, 0.45);
            o.x = rand(0.2, 0.8);
          }
          ctx.save();
          ctx.translate(o.x * w, o.y * h);
          ctx.rotate(o.rot);
          ctx.fillStyle = `rgba(255,190,210,${0.9 * A})`;
          ctx.beginPath();
          ctx.ellipse(0, 0, 4 * k7, 2.2 * k7, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      } else if (mode === "leaves") {
        const sa = dark ? 0.9 : 0.8;
        const sky = ctx.createLinearGradient(0, 0, 0, h);
        sky.addColorStop(0, `rgba(80,60,70,${sa})`);
        sky.addColorStop(1, `rgba(200,120,60,${sa})`);
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, w, h);
        glowAbs(w * 0.75, h * 0.25, m * 0.6, 0.3 * A, 35, 65, 90);
        const lv = once("leaves", () =>
          Array.from({ length: 40 }, () => ({ x: Math.random(), y: Math.random(), r: rand(0.018, 0.035), s: rand(0.02, 0.04), rot: rand(0, 6.28), vr: rand(-0.8, 0.8), p: rand(0, 6.28), hh: rand(8, 45), l: rand(40, 55) }))
        );
        for (const o of lv) {
          o.y += dt * o.s;
          o.x += dt * Math.sin(ts * 0.4 + o.p) * 0.025;
          o.rot += o.vr * dt;
          if (o.y > 1.06) {
            o.y = -0.06;
            o.x = Math.random();
          }
          const r = o.r * m;
          ctx.save();
          ctx.translate(o.x * w, o.y * h);
          ctx.rotate(o.rot + Math.sin(ts * 0.9 + o.p) * 0.5);
          ctx.scale(1, 0.5 + 0.5 * Math.abs(Math.cos(ts * 0.6 + o.p)));
          ctx.fillStyle = hsl(o.hh, 0.95 * A, o.l, 85);
          ctx.beginPath();
          ctx.moveTo(0, -r);
          ctx.quadraticCurveTo(r * 0.9, -r * 0.2, 0, r);
          ctx.quadraticCurveTo(-r * 0.9, -r * 0.2, 0, -r);
          ctx.fill();
          ctx.strokeStyle = hsl(o.hh, 0.6 * A, 28, 70);
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(0, -r * 0.8);
          ctx.lineTo(0, r * 1.3);
          ctx.stroke();
          ctx.restore();
        }
      } else if (mode === "meadow") {
        const sa = dark ? 0.92 : 0.85;
        const sky = ctx.createLinearGradient(0, 0, 0, h);
        sky.addColorStop(0, `rgba(90,160,220,${sa})`);
        sky.addColorStop(1, `rgba(210,235,245,${sa})`);
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, w, h);
        glowAbs(w * 0.2, h * 0.15, m * 0.5, 0.5 * A, 50, 85, 90);
        const cl = once("meadowClouds", () => Array.from({ length: 4 }, () => ({ x: rand(-0.2, 1.2), y: rand(0.08, 0.3), s: rand(0.7, 1.2) })));
        ctx.fillStyle = `rgba(255,255,255,${0.85 * A})`;
        for (const c of cl) {
          c.x += dt * 0.006;
          if (c.x > 1.25) c.x = -0.25;
          const r = m * 0.05 * c.s, x = c.x * w, y = c.y * h;
          ctx.beginPath();
          for (const [dx, dy, rr] of [[-1.1, 0.2, 0.7], [-0.4, -0.3, 1], [0.5, -0.1, 0.85], [1.2, 0.25, 0.65], [0, 0.35, 0.8]]) {
            ctx.moveTo(x + dx * r + rr * r, y + dy * r);
            ctx.arc(x + dx * r, y + dy * r, rr * r, 0, Math.PI * 2);
          }
          ctx.fill();
        }
        // hills
        [[0.62, 0.05, 120, 40], [0.7, 0.04, 105, 32]].forEach(([yb, amp, hh, l], i) => {
          ctx.fillStyle = hsl(hh, A, l, 45);
          ctx.beginPath();
          ctx.moveTo(0, h);
          for (let x = 0; x <= w + 20; x += 20) ctx.lineTo(x, h * (yb + amp * Math.sin((x / w) * 4 + i * 2)));
          ctx.lineTo(w, h);
          ctx.fill();
        });
        const grass = once("grass", () =>
          Array.from({ length: 260 }, () => ({ x: Math.random(), hh: rand(85, 130), l: rand(30, 48), len: rand(0.12, 0.3), flower: Math.random() < 0.12 ? KIDS[Math.floor(rand(0, KIDS.length))] : -1 })).sort((a, b) => a.len - b.len)
        );
        ctx.lineWidth = Math.max(1.5, 2.5 * k7);
        for (const g of grass) {
          const x = g.x * w, len = g.len * h;
          const wind = Math.sin(ts * 0.6 + g.x * 3) * 0.35 + Math.sin(g.x * 8 - ts * 0.9) * 0.25 * (1 + bass * 0.5);
          const tx = x + wind * len * 0.5, ty = h - len * (1 - Math.abs(wind) * 0.15);
          ctx.strokeStyle = hsl(g.hh, A, g.l, 60);
          ctx.beginPath();
          ctx.moveTo(x, h + 2);
          ctx.quadraticCurveTo(x, h - len * 0.5, tx, ty);
          ctx.stroke();
          if (g.flower >= 0) {
            ctx.fillStyle = hsl(g.flower, A, 65, 90);
            ctx.beginPath();
            ctx.arc(tx, ty, 4 * k7, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      } else if (mode === "mountains") {
        const sa = dark ? 0.95 : 0.85;
        const sky = ctx.createLinearGradient(0, 0, 0, h);
        sky.addColorStop(0, `rgba(70,60,120,${sa})`);
        sky.addColorStop(0.55, `rgba(240,150,120,${sa})`);
        sky.addColorStop(1, `rgba(250,210,150,${sa})`);
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, w, h);
        const sunY = h * (0.52 - 0.03 * Math.sin(ts * 0.03));
        glowAbs(w * 0.5, sunY, m * 0.55, 0.55 * A, 40, 75, 95);
        ctx.fillStyle = `rgba(255,236,190,${0.95 * A})`;
        ctx.beginPath();
        ctx.arc(w * 0.5, sunY, m * 0.07, 0, Math.PI * 2);
        ctx.fill();
        const ridges = once("ridges", () => Array.from({ length: 4 }, () => Array.from({ length: 4 }, (_, k) => ({ f: 2 + k * 2.7 + rand(0, 1), ph: rand(0, 6.28), a: 1 / (k + 1) }))));
        const tones = [[176, 140, 170], [124, 96, 140], [80, 62, 108], [42, 34, 66]];
        ridges.forEach((waves, l) => {
          const yb = h * (0.5 + l * 0.12), amp = h * (0.16 - l * 0.02);
          const [r, g, b] = tones[l];
          ctx.fillStyle = `rgba(${r},${g},${b},${A})`;
          ctx.beginPath();
          ctx.moveTo(0, h);
          for (let x = 0; x <= w + 8; x += 8) {
            let y = 0;
            for (const s of waves) y += s.a * (1 - Math.abs(Math.sin((x / w) * s.f + s.ph)));
            ctx.lineTo(x, yb - (y / 2) * amp);
          }
          ctx.lineTo(w, h);
          ctx.fill();
          // haze
          const hz = ctx.createLinearGradient(0, yb - amp * 0.2, 0, yb + h * 0.1);
          hz.addColorStop(0, "rgba(255,220,210,0)");
          hz.addColorStop(1, `rgba(255,220,210,${0.18 * A})`);
          ctx.fillStyle = hz;
          ctx.fillRect(0, yb - amp * 0.2, w, h * 0.3);
        });
        const flock = once("flock", () => ({ x: -0.1, y: 0.25, birds: Array.from({ length: 7 }, (_, i) => ({ dx: -Math.abs(i - 3) * 0.025 + rand(-0.01, 0.01), dy: (i - 3) * 0.018, p: rand(0, 6.28) })) }));
        flock.x += dt * 0.018;
        if (flock.x > 1.3) {
          flock.x = -0.2;
          flock.y = rand(0.15, 0.35);
        }
        ctx.strokeStyle = `rgba(40,30,50,${0.8 * A})`;
        ctx.lineWidth = Math.max(1, 1.5 * k7);
        for (const b of flock.birds) {
          const x = (flock.x + b.dx) * w, y = (flock.y + b.dy + Math.sin(ts * 0.5 + b.p) * 0.005) * h;
          const s = 7 * k7, f = Math.sin(ts * 4 + b.p) * s * 0.5;
          ctx.beginPath();
          ctx.moveTo(x - s, y - f);
          ctx.quadraticCurveTo(x - s * 0.4, y - s * 0.3, x, y);
          ctx.quadraticCurveTo(x + s * 0.4, y - s * 0.3, x + s, y - f);
          ctx.stroke();
        }
      } else if (mode === "ocean") {
        const hy = h * 0.5, sa = dark ? 0.95 : 0.85;
        const sky = ctx.createLinearGradient(0, 0, 0, hy);
        sky.addColorStop(0, `rgba(8,14,40,${sa})`);
        sky.addColorStop(1, `rgba(40,60,110,${sa})`);
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, w, hy + 2);
        const st = once("oceanStars", () => Array.from({ length: 70 }, () => ({ x: Math.random(), y: Math.random() * 0.45, p: rand(0, 6.28) })));
        for (const s of st) {
          ctx.fillStyle = `rgba(255,250,235,${(0.25 + 0.5 * (0.5 + 0.5 * Math.sin(ts * 0.7 + s.p))) * A})`;
          ctx.beginPath();
          ctx.arc(s.x * w, s.y * h, 1.1 * k7, 0, Math.PI * 2);
          ctx.fill();
        }
        const mx = w * 0.7, my = h * 0.2;
        glowAbs(mx, my, m * 0.35, 0.3 * A, 220, 85, 60);
        ctx.fillStyle = `rgba(250,245,225,${A})`;
        ctx.beginPath();
        ctx.arc(mx, my, m * 0.055, 0, Math.PI * 2);
        ctx.fill();
        for (let l = 0; l < 6; l++) {
          const f = l / 5;
          const y0 = hy + (h - hy) * Math.pow(f, 1.25) * 0.92;
          const amp = h * (0.006 + f * 0.028) * (1 + bass * 0.25);
          ctx.fillStyle = `hsla(220 60% ${26 - f * 16}% / ${A})`;
          ctx.beginPath();
          ctx.moveTo(0, h);
          for (let x = 0; x <= w + 12; x += 12) {
            const u = x / w;
            ctx.lineTo(x, y0 + Math.sin(u * (9 - f * 5) * Math.PI + ts * (0.25 + f * 0.35) + l * 1.3) * amp + Math.sin(u * 17 + ts * 0.4 + l) * amp * 0.3);
          }
          ctx.lineTo(w, h);
          ctx.fill();
        }
        // moonlight shimmering on the water
        for (let i = 0; i < 26; i++) {
          const f = i / 26, y = hy + 4 + (h - hy) * Math.pow(f, 1.3) * 0.95;
          const half = m * (0.025 + f * 0.07) * (0.5 + 0.5 * Math.abs(Math.sin(ts * 0.8 + i * 1.9)));
          ctx.fillStyle = `rgba(240,240,220,${(0.5 - f * 0.3) * A})`;
          ctx.fillRect(mx - half + Math.sin(ts * 0.5 + i) * m * 0.02, y, half * 2, Math.max(1.2, 2.5 * k7 * (0.5 + f)));
        }
      } else if (mode === "space") {
        ctx.globalAlpha = GA;
        skyFill("#0b1640", "#2a1f5c");
        const st = once("spaceStars", () => Array.from({ length: 120 }, () => ({ x: Math.random(), y: Math.random(), z: rand(0.3, 1) })));
        for (const s of st) {
          s.y += dt * 0.06 * s.z * (0.7 + bass * 0.6);
          if (s.y > 1) {
            s.y = 0;
            s.x = Math.random();
          }
          circ(ctx, s.x * w, s.y * h, (0.6 + s.z * 1.4) * k7, `rgba(255,255,255,${0.4 + 0.6 * s.z})`);
        }
        const pl = once("spacePlanets", () => [
          { x: 0.8, y: 0.2, r: 0.11, c: "#ff9f6b", ring: true },
          { x: 0.15, y: 0.65, r: 0.07, c: "#6bc6ff", ring: false },
          { x: 0.7, y: 0.85, r: 0.05, c: "#b58cff", ring: false },
        ]);
        for (const p of pl) {
          p.y += dt * 0.012;
          if (p.y > 1.3) {
            p.y = -0.25;
            p.x = rand(0.1, 0.9);
          }
          const x = p.x * w, y = p.y * h, r = p.r * m;
          circ(ctx, x, y, r, p.c);
          ell(ctx, x - r * 0.3, y - r * 0.3, r * 0.35, r * 0.2, -0.6, "rgba(255,255,255,0.25)");
          if (p.ring) {
            ctx.strokeStyle = "#ffe1a8";
            ctx.lineWidth = r * 0.12;
            ctx.beginPath();
            ctx.ellipse(x, y, r * 1.6, r * 0.4, -0.3, 0, Math.PI * 2);
            ctx.stroke();
          }
        }
        // the rocket, nose up, with a happy pilot in the window
        const s = m * 0.13;
        ctx.save();
        ctx.translate(w * 0.45 + Math.sin(ts * 0.6) * w * 0.05, h * 0.52 + Math.sin(ts * 1.2) * h * 0.04);
        ctx.rotate(Math.sin(ts * 0.6) * 0.12);
        const fl = s * (0.55 + 0.15 * Math.sin(ts * 22) + bass * 0.3);
        ell(ctx, 0, s * 0.62 + fl * 0.4, s * 0.22, fl * 0.55, 0, "#ff8a2b");
        ell(ctx, 0, s * 0.62 + fl * 0.3, s * 0.12, fl * 0.35, 0, "#ffe066");
        ctx.fillStyle = "#e84a5f";
        ctx.beginPath();
        for (const sx of [-1, 1]) {
          ctx.moveTo(sx * s * 0.3, s * 0.1);
          ctx.lineTo(sx * s * 0.65, s * 0.7);
          ctx.lineTo(sx * s * 0.3, s * 0.55);
        }
        ctx.fill();
        ctx.fillStyle = "#f2f4f8";
        ctx.beginPath();
        ctx.moveTo(0, -s);
        ctx.quadraticCurveTo(s * 0.55, -s * 0.45, s * 0.38, s * 0.6);
        ctx.lineTo(-s * 0.38, s * 0.6);
        ctx.quadraticCurveTo(-s * 0.55, -s * 0.45, 0, -s);
        ctx.fill();
        ctx.save();
        ctx.clip();
        ctx.fillStyle = "#e84a5f";
        ctx.fillRect(-s, -s, s * 2, s * 0.42);
        ctx.restore();
        circ(ctx, 0, -s * 0.05, s * 0.27, "#9aa6b8");
        circ(ctx, 0, -s * 0.05, s * 0.22, "#bfe6ff");
        face(ctx, 0, -s * 0.05, s * 0.2, blinkAt(ts, 2));
        ctx.restore();
      } else if (mode === "hotair") {
        ctx.globalAlpha = GA;
        skyFill("#ffd6e0", "#c8ecff");
        glowAbs(w * 0.8, h * 0.2, m * 0.4, 0.5, 45, 85, 90);
        driftClouds("hotClouds", 5, "rgba(255,255,255,0.9)", 0.01);
        const pal = [["#ff6b8b", "#ffd166"], ["#6bc6ff", "#ffffff"], ["#8be28b", "#ffe066"], ["#b58cff", "#ffc2e0"], ["#ffa62b", "#ff6b6b"]];
        const bl = once("hotair", () =>
          Array.from({ length: 7 }, (_, i) => ({ x: rand(0.05, 0.95), y: rand(0.1, 1.2), s: rand(0.5, 1), p: rand(0, 6.28), c: pal[i % pal.length] })).sort((a, b) => a.s - b.s)
        );
        for (const b of bl) {
          b.y -= dt * 0.018 * b.s * (0.8 + bass * 0.4);
          if (b.y < -0.3) {
            b.y = 1.3;
            b.x = rand(0.05, 0.95);
          }
          const r = m * 0.09 * b.s, x = (b.x + Math.sin(ts * 0.3 + b.p) * 0.03) * w, y = b.y * h;
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate(Math.sin(ts * 0.5 + b.p) * 0.05);
          ctx.strokeStyle = "#7a5a3a";
          ctx.lineWidth = Math.max(1, r * 0.03);
          ctx.beginPath();
          for (const sx of [-1, 1]) {
            ctx.moveTo(sx * r * 0.42, r * 0.78);
            ctx.lineTo(sx * r * 0.22, r * 1.35);
          }
          ctx.stroke();
          ctx.fillStyle = "#a0703f";
          ctx.fillRect(-r * 0.25, r * 1.35, r * 0.5, r * 0.32);
          ctx.beginPath();
          ctx.moveTo(0, r * 0.95);
          ctx.bezierCurveTo(-r * 1.3, r * 0.1, -r * 1.1, -r * 1.15, 0, -r * 1.15);
          ctx.bezierCurveTo(r * 1.1, -r * 1.15, r * 1.3, r * 0.1, 0, r * 0.95);
          ctx.fillStyle = b.c[0];
          ctx.fill();
          ctx.save();
          ctx.clip();
          for (const dx of [-0.75, 0, 0.75]) ell(ctx, dx * r, 0, r * 0.2, r * 1.3, 0, b.c[1]);
          ctx.restore();
          ctx.restore();
        }
      } else if (mode === "kites") {
        ctx.globalAlpha = GA;
        skyFill("#7fd0ff", "#e8f7ff");
        driftClouds("kiteClouds", 4, "rgba(255,255,255,0.9)", 0.012);
        ctx.fillStyle = "#7fcf5f";
        ctx.beginPath();
        ctx.ellipse(w / 2, h * 1.1, w * 0.8, h * 0.2, 0, 0, Math.PI * 2);
        ctx.fill();
        const cols = [["#ff6b6b", "#ffd166"], ["#6bc6ff", "#b58cff"], ["#ff8fd1", "#8be28b"], ["#ffa62b", "#6bc6ff"]];
        for (let i = 0; i < 4; i++) {
          const ax = w * (0.15 + i * 0.23), ay = h * 0.97;
          const kx = ax + Math.sin(ts * 0.5 + i * 1.7) * w * 0.06 + w * 0.05, ky = h * (0.22 + (i % 2) * 0.15) + Math.sin(ts * 0.7 + i) * h * 0.04 * (1 + bass * 0.5);
          const s = m * 0.07, tilt = Math.sin(ts * 0.8 + i) * 0.25;
          ctx.strokeStyle = "rgba(60,60,80,0.5)";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(kx, ky + s * 1.1);
          ctx.quadraticCurveTo(kx - w * 0.05, (ky + ay) / 2 + h * 0.08, ax, ay);
          ctx.stroke();
          ctx.save();
          ctx.translate(kx, ky);
          ctx.rotate(tilt);
          // tail with bows
          ctx.strokeStyle = cols[i][0];
          ctx.lineWidth = Math.max(1, 2 * k7);
          ctx.beginPath();
          ctx.moveTo(0, s * 1.1);
          const pts = [];
          for (let j = 1; j <= 12; j++) {
            const px = Math.sin(ts * 2.5 + j * 0.6 + i) * s * 0.25 * (j / 12) * 2, py = s * 1.1 + j * s * 0.22;
            ctx.lineTo(px, py);
            if (j % 3 === 0) pts.push([px, py]);
          }
          ctx.stroke();
          for (const [px, py] of pts) {
            ctx.fillStyle = cols[i][1];
            ctx.beginPath();
            ctx.moveTo(px, py);
            ctx.lineTo(px - s * 0.18, py - s * 0.1);
            ctx.lineTo(px - s * 0.18, py + s * 0.1);
            ctx.moveTo(px, py);
            ctx.lineTo(px + s * 0.18, py - s * 0.1);
            ctx.lineTo(px + s * 0.18, py + s * 0.1);
            ctx.fill();
          }
          const quad = (x1, y1, c) => {
            ctx.fillStyle = c;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(x1, 0);
            ctx.lineTo(0, y1);
            ctx.fill();
          };
          quad(-s * 0.75, -s * 1.1, cols[i][0]);
          quad(s * 0.75, -s * 1.1, cols[i][1]);
          quad(-s * 0.75, s * 1.1, cols[i][1]);
          quad(s * 0.75, s * 1.1, cols[i][0]);
          ctx.restore();
        }
      } else if (mode === "sheep") {
        const sky = ctx.createLinearGradient(0, 0, 0, h);
        sky.addColorStop(0, `rgba(14,18,48,${dark ? 0.95 : 0.85})`);
        sky.addColorStop(1, `rgba(44,40,92,${dark ? 0.95 : 0.85})`);
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, w, h);
        const st = once("sheepStars", () => Array.from({ length: 60 }, () => ({ x: Math.random(), y: Math.random() * 0.6, p: rand(0, 6.28) })));
        for (const s of st) circ(ctx, s.x * w, s.y * h, 1.1 * k7, `rgba(255,250,235,${0.2 + 0.45 * (0.5 + 0.5 * Math.sin(ts * 0.6 + s.p))})`);
        glowAbs(w * 0.82, h * 0.18, m * 0.2, 0.18, 50, 80, 60);
        circ(ctx, w * 0.82, h * 0.18, m * 0.05, "rgba(253,243,196,0.9)");
        const ground = h * 0.8;
        ctx.fillStyle = "rgba(34,58,62,0.95)";
        ctx.beginPath();
        ctx.ellipse(w / 2, ground + h * 0.32, w * 0.9, h * 0.34, 0, 0, Math.PI * 2);
        ctx.fill();
        // fence
        const fx = w / 2, fh = h * 0.15, fw = m * 0.22;
        ctx.fillStyle = "rgba(150,110,80,0.75)";
        for (const dx of [-1, 0, 1]) ctx.fillRect(fx + dx * fw * 0.5 - fw * 0.05, ground - fh, fw * 0.1, fh + 4);
        ctx.fillRect(fx - fw * 0.7, ground - fh * 0.8, fw * 1.4, fh * 0.12);
        ctx.fillRect(fx - fw * 0.7, ground - fh * 0.4, fw * 1.4, fh * 0.12);
        // one sheep at a time, slowly hopping over
        const period = 5;
        const phase = (ts / period) % 1, count = Math.floor(ts / period) + 1;
        const xn = -0.15 + phase * 1.3;
        const hop = Math.max(0, 1 - Math.pow((xn - 0.5) / 0.14, 2));
        const r = m * 0.12, x = xn * w, y = ground - r * 0.75 - hop * h * 0.24;
        ctx.strokeStyle = "rgba(60,54,70,0.9)";
        ctx.lineWidth = r * 0.14;
        ctx.beginPath();
        for (const dx of [-0.5, -0.2, 0.25, 0.55]) {
          ctx.moveTo(x + dx * r, y + r * 0.3);
          ctx.lineTo(x + dx * r + (hop ? (dx < 0 ? -1 : 1) * r * 0.25 : 0), y + r * (hop ? 0.75 : 0.8));
        }
        ctx.stroke();
        ctx.fillStyle = "rgba(243,241,246,0.92)";
        ctx.beginPath();
        for (const [dx, dy, rr] of [[-0.55, 0, 0.45], [0, -0.25, 0.5], [0.5, 0, 0.45], [0, 0.2, 0.5], [-0.25, 0.15, 0.4], [0.3, 0.2, 0.4]]) {
          ctx.moveTo(x + dx * r + rr * r, y + dy * r);
          ctx.arc(x + dx * r, y + dy * r, rr * r, 0, Math.PI * 2);
        }
        ctx.fill();
        ell(ctx, x + r * 0.95, y - r * 0.15, r * 0.36, r * 0.42, 0.2, "rgba(214,206,222,0.95)");
        face(ctx, x + r * 0.98, y - r * 0.12, r * 0.38, 0, 0, true);
        ctx.font = `600 ${Math.round(30 * k7)}px system-ui, sans-serif`;
        ctx.textAlign = "center";
        ctx.fillStyle = "rgba(255,255,255,0.45)";
        ctx.fillText(`${((count - 1) % 99) + 1}`, w / 2, h * 0.12);
      } else if (mode === "sleepymoon") {
        const sky = ctx.createLinearGradient(0, 0, 0, h);
        sky.addColorStop(0, `rgba(12,16,44,${dark ? 0.95 : 0.85})`);
        sky.addColorStop(1, `rgba(40,34,84,${dark ? 0.95 : 0.85})`);
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, w, h);
        const st = once("moonStars", () => Array.from({ length: 70 }, () => ({ x: Math.random(), y: Math.random(), p: rand(0, 6.28), s: rand(0.6, 1.4) })));
        for (const s of st) circ(ctx, s.x * w, s.y * h, s.s * k7, `rgba(255,250,235,${0.15 + 0.45 * (0.5 + 0.5 * Math.sin(ts * 0.5 + s.p))})`);
        driftClouds("moonClouds", 4, "rgba(200,190,240,0.12)", 0.006, 0.07);
        const cx = w / 2, R = m * 0.16;
        const rock = Math.sin(ts * 0.45) * 0.1;
        ctx.strokeStyle = "rgba(255,240,220,0.25)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(cx, 0);
        ctx.lineTo(cx + Math.sin(rock) * h * 0.1, h * 0.5 - R * 1.6);
        ctx.stroke();
        glowAbs(cx, h * 0.52, R * 2.6, 0.22, 50, 75, 70);
        ctx.save();
        ctx.translate(cx, h * 0.52);
        ctx.rotate(rock);
        circ(ctx, 0, 0, R, "rgba(253,240,190,0.95)");
        for (const [dx, dy, rr] of [[-0.45, 0.45, 0.12], [0.5, 0.35, 0.09], [0.2, 0.65, 0.07]]) circ(ctx, dx * R, dy * R, rr * R, "rgba(230,214,160,0.7)");
        face(ctx, 0, R * 0.05, R * 0.9, 0, 0, true);
        // nightcap
        ctx.fillStyle = "rgba(120,140,230,0.92)";
        ctx.beginPath();
        ctx.moveTo(-R * 0.95, -R * 0.35);
        ctx.quadraticCurveTo(-R * 0.2, -R * 1.6, R * 1.25, -R * 1.25);
        ctx.quadraticCurveTo(R * 0.5, -R * 0.9, R * 0.95, -R * 0.35);
        ctx.quadraticCurveTo(0, -R * 0.75, -R * 0.95, -R * 0.35);
        ctx.fill();
        ctx.fillStyle = "rgba(255,255,255,0.9)";
        ctx.beginPath();
        ctx.ellipse(0, -R * 0.5, R * 1.0, R * 0.16, 0.05, 0, Math.PI * 2);
        ctx.fill();
        circ(ctx, R * 1.28, -R * 1.22, R * 0.16, "rgba(255,255,255,0.9)");
        ctx.restore();
        const zs = once("zzz", () => []);
        if (Math.random() < dt * 0.5 && zs.length < 6) zs.push({ life: 1, x: cx + R * 0.9, y: h * 0.52 - R * 0.4 });
        ctx.textAlign = "center";
        for (let i = zs.length - 1; i >= 0; i--) {
          const z = zs[i];
          z.life -= dt * 0.18;
          if (z.life <= 0) {
            zs.splice(i, 1);
            continue;
          }
          const k = 1 - z.life;
          ctx.font = `700 ${Math.round((14 + k * 22) * k7)}px system-ui, sans-serif`;
          ctx.fillStyle = `rgba(220,215,255,${0.6 * Math.min(1, z.life * 2)})`;
          ctx.fillText("z", z.x + k * R * 1.2 + Math.sin(k * 6) * R * 0.1, z.y - k * R * 2);
        }
      } else if (mode === "jellyfish") {
        const sea = ctx.createLinearGradient(0, 0, 0, h);
        sea.addColorStop(0, `rgba(4,22,52,${dark ? 0.95 : 0.88})`);
        sea.addColorStop(1, `rgba(2,8,24,${dark ? 0.95 : 0.88})`);
        ctx.fillStyle = sea;
        ctx.fillRect(0, 0, w, h);
        ctx.globalCompositeOperation = "lighter";
        const dots = once("plankton", () => Array.from({ length: 50 }, () => ({ x: Math.random(), y: Math.random(), p: rand(0, 6.28) })));
        for (const d of dots) {
          d.y -= dt * 0.004;
          if (d.y < 0) d.y = 1;
          circ(ctx, (d.x + Math.sin(ts * 0.2 + d.p) * 0.01) * w, d.y * h, 1.1 * k7, `rgba(150,220,255,${0.12 + 0.12 * Math.sin(ts + d.p)})`);
        }
        const js = once("jellies", () => Array.from({ length: 6 }, () => ({ x: rand(0.1, 0.9), y: rand(0.1, 1.1), s: rand(0.6, 1.1), p: rand(0, 6.28), hh: rand(180, 320), sp: rand(0.7, 1.1) })));
        for (const j of js) {
          const pulse = 0.5 + 0.5 * Math.sin(ts * 0.9 * j.sp + j.p);
          j.y -= dt * 0.01 * j.s * (0.3 + pulse);
          if (j.y < -0.25) {
            j.y = 1.25;
            j.x = rand(0.1, 0.9);
          }
          const r = m * 0.07 * j.s, x = (j.x + Math.sin(ts * 0.15 + j.p) * 0.03) * w, y = j.y * h;
          glowAbs(x, y, r * 3, 0.14, j.hh, 60, 80);
          ctx.strokeStyle = hsl(j.hh, 0.22, 70, 80);
          ctx.lineWidth = Math.max(1, 1.4 * k7);
          ctx.beginPath();
          for (let k = 0; k < 5; k++) {
            const tx = x + (k - 2) * r * 0.32;
            ctx.moveTo(tx, y);
            for (let q = 1; q <= 8; q++) ctx.lineTo(tx + Math.sin(ts * 1.2 + q * 0.7 + k + j.p) * r * 0.12 * (q / 8) * 3, y + q * r * 0.32 * (1.1 - pulse * 0.2));
          }
          ctx.stroke();
          const rx = r * (1 + 0.1 * pulse), ry = r * (0.85 - 0.12 * pulse);
          const g = ctx.createRadialGradient(x, y - ry * 0.4, 0, x, y, rx);
          g.addColorStop(0, hsl(j.hh, 0.5, 80, 80));
          g.addColorStop(1, hsl(j.hh, 0.12, 60, 80));
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.ellipse(x, y, rx, ry, 0, Math.PI, 0);
          ctx.quadraticCurveTo(x, y + ry * 0.35, x - rx, y);
          ctx.fill();
        }
      } else if (mode === "projector") {
        ctx.fillStyle = `rgba(10,8,30,${dark ? 0.95 : 0.88})`;
        ctx.fillRect(0, 0, w, h);
        ctx.globalCompositeOperation = "lighter";
        const cx = w / 2, cy = h * 0.45;
        glowAbs(cx, h, m * 0.5, 0.18, 280, 70, 60);
        const sh = once("projShapes", () => Array.from({ length: 60 }, () => ({ a: rand(0, 6.28), d: Math.sqrt(Math.random()) * 0.85, k: Math.floor(rand(0, 3)), s: rand(0.012, 0.03), hh: rand(0, 360), p: rand(0, 6.28) })));
        const R = Math.hypot(w, h) * 0.55, rot = ts * 0.035;
        for (const o of sh) {
          const x = cx + Math.cos(o.a + rot) * o.d * R, y = cy + Math.sin(o.a + rot) * o.d * R * 0.75;
          const r = o.s * m * 1.4;
          const a = 0.3 + 0.25 * Math.sin(ts * 0.5 + o.p);
          ctx.fillStyle = hsl(o.hh + ts * 4, a, 72, 60);
          ctx.beginPath();
          if (o.k === 0) star5(ctx, x, y, r);
          else if (o.k === 1) heart(ctx, x, y, r * 0.8);
          else twinkle(ctx, x, y, r);
          ctx.fill();
        }
      } else if (mode === "spoonplane") {
        ctx.globalAlpha = GA;
        skyFill("#7cc8f5", "#e3f6ff");
        sunFace(w * 0.12, h * 0.18, m * 0.07);
        driftClouds("planeClouds", 5, "#ffffff", 0.02);
        const pa = ts * 0.45;
        const px = w / 2 + Math.sin(pa) * w * 0.3, py = h * 0.52 + Math.sin(pa * 2) * h * 0.18;
        const vx = Math.cos(pa) * w * 0.3, vy = 2 * Math.cos(pa * 2) * h * 0.18;
        const trail = once("planeTrail", () => []);
        trail.push(px, py);
        if (trail.length > 80) trail.splice(0, 2);
        for (let i = 0; i < trail.length - 8; i += 8) circ(ctx, trail[i], trail[i + 1], (2 + i * 0.08) * k7, "rgba(255,255,255,0.85)");
        const s = m * 0.15 * (1 + bass * 0.05);
        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(Math.atan2(vy, vx));
        if (vx < 0) ctx.scale(1, -1);
        ctx.fillStyle = "#e84a5f";
        ctx.beginPath();
        ctx.moveTo(-s * 0.9, -s * 0.1);
        ctx.lineTo(-s * 1.35, -s * 0.75);
        ctx.lineTo(-s * 0.7, -s * 0.3);
        ctx.fill();
        // spoon with a yummy bite
        ctx.strokeStyle = "#c9ced6";
        ctx.lineWidth = s * 0.1;
        ctx.beginPath();
        ctx.moveTo(s * 0.4, s * 0.35);
        ctx.lineTo(s * 1.45, s * 0.55);
        ctx.stroke();
        ell(ctx, s * 1.7, s * 0.6, s * 0.3, s * 0.18, 0.18, "#dfe3ea");
        ell(ctx, s * 1.7, s * 0.53, s * 0.2, s * 0.11, 0.18, "#ffb347");
        ell(ctx, 0, 0, s * 1.2, s * 0.42, 0, "#ff6b6b");
        ell(ctx, -s * 0.1, s * 0.15, s * 0.28, s * 0.75, 0.25, "#ffd166");
        circ(ctx, s * 0.35, -s * 0.38, s * 0.32, "#bfe6ff");
        animal(ctx, "bear", s * 0.35, -s * 0.4, s * 0.24, blinkAt(ts, 3), 0);
        ell(ctx, s * 1.22, 0, s * 0.07, s * 0.55 * Math.abs(Math.sin(ts * 25)) + 1, 0, "#666");
        ctx.restore();
      } else if (mode === "animals") {
        ctx.globalAlpha = GA;
        skyFill("#c9f0ff", "#fff6d8");
        sunFace(w * 0.86, h * 0.17, m * 0.06);
        driftClouds("animalClouds", 3, "#ffffff", 0.012, 0.045);
        ctx.fillStyle = "#8fd16a";
        ctx.beginPath();
        ctx.ellipse(w / 2, h * 1.12, w * 0.85, h * 0.42, 0, 0, Math.PI * 2);
        ctx.fill();
        const r = Math.min(w / 12, h * 0.14);
        ANIMALS.forEach((kind, i) => {
          const x = (w * (i + 0.5)) / 5;
          const hop = Math.abs(Math.sin(t * 2.6 + i * 1.3)) * h * 0.04 * (0.5 + bass);
          ell(ctx, x, h * 0.6 + r * 1.05, r * 0.8, r * 0.15, 0, "rgba(0,0,0,0.12)");
          ctx.save();
          ctx.translate(x, h * 0.6 - hop);
          ctx.rotate(Math.sin(t * 2.6 + i) * 0.14 * (0.5 + bass));
          animal(ctx, kind, 0, 0, r, blinkAt(ts, i), spec[i * 6 + 2] * 1.4);
          ctx.restore();
        });
        floatNotes();
      } else if (mode === "fruits") {
        ctx.globalAlpha = GA;
        skyFill("#fff3d6", "#ffd9e0");
        const ty = h * 0.78, sq = w / 14;
        for (let gx = 0; gx * sq < w; gx++)
          for (let gy = 0; ty + gy * sq < h; gy++) {
            ctx.fillStyle = (gx + gy) % 2 ? "#ffffff" : "#ff7b8a";
            ctx.fillRect(gx * sq, ty + gy * sq, sq + 1, sq + 1);
          }
        const r = Math.min(w / 13, h * 0.12);
        ["apple", "orange", "strawberry", "watermelon", "grapes"].forEach((kind, i) => {
          const x = (w * (i + 0.5)) / 5;
          const hop = Math.abs(Math.sin(t * 2.4 + i * 0.9));
          const y = ty - r * 1.05 - hop * h * 0.12 * (0.6 + bass * 0.6);
          const sx = 1 + Math.pow(1 - hop, 6) * 0.15;
          ell(ctx, x, ty + r * 0.05, r * (1.1 - hop * 0.4), r * 0.15, 0, "rgba(0,0,0,0.15)");
          ctx.save();
          ctx.translate(x, y + r);
          ctx.scale(sx, 1 / sx);
          ctx.translate(-x, -(y + r));
          fruit(ctx, kind, x, y, r, blinkAt(ts, i + 1), spec[i * 7 + 2] * 1.4);
          ctx.restore();
        });
        floatNotes();
      } else if (mode === "train") {
        ctx.globalAlpha = GA;
        skyFill("#a6e1ff", "#f2fbff");
        sunFace(w * 0.15, h * 0.18, m * 0.06);
        driftClouds("trainClouds", 4, "#ffffff", 0.01, 0.045);
        ell(ctx, w * 0.25, h * 0.95, w * 0.5, h * 0.35, 0, "#9ad97a");
        ell(ctx, w * 0.8, h * 0.98, w * 0.55, h * 0.32, 0, "#86cc68");
        const track = h * 0.82;
        ctx.fillStyle = "#8b6b4a";
        for (let x = (-(ts * 40) % 30) - 30; x < w + 30; x += 30 * k7) ctx.fillRect(x, track + 4 * k7, 14 * k7, 6 * k7);
        ctx.fillStyle = "#6d6d78";
        ctx.fillRect(0, track + 2 * k7, w, 3 * k7);
        const u = m * 0.18, len = u * (1.7 + 3 * 1.35);
        const front = -u + ((ts * 0.06) % 1) * (w + len + u * 2);
        const wheel = (x, y, r) => {
          circ(ctx, x, y, r, "#3a3a46");
          circ(ctx, x, y, r * 0.45, "#c9ced6");
          ctx.strokeStyle = "#3a3a46";
          ctx.lineWidth = r * 0.15;
          ctx.beginPath();
          const a = front / r;
          ctx.moveTo(x + Math.cos(a) * r * 0.45, y + Math.sin(a) * r * 0.45);
          ctx.lineTo(x - Math.cos(a) * r * 0.45, y - Math.sin(a) * r * 0.45);
          ctx.stroke();
        };
        // carriages with animal passengers
        const cars = ["#ffd166", "#6bc6ff", "#b58cff"];
        cars.forEach((c, k) => {
          const x1 = front - u * 1.7 - (k + 1) * u * 1.35;
          const jig = Math.sin(ts * 9 + k) * 1.2 * k7;
          animal(ctx, ANIMALS[(k + 1) % ANIMALS.length], x1 + u * 0.6, track - u * 0.95 + jig, u * 0.32, blinkAt(ts, k + 2), spec[k * 9 + 3]);
          ctx.fillStyle = c;
          ctx.fillRect(x1, track - u * 0.75 + jig, u * 1.2, u * 0.6);
          ctx.fillStyle = "rgba(0,0,0,0.12)";
          ctx.fillRect(x1, track - u * 0.75 + jig, u * 1.2, u * 0.1);
          ctx.fillStyle = "#6d6d78";
          ctx.fillRect(x1 + u * 1.2, track - u * 0.3, u * 0.15, u * 0.08);
          wheel(x1 + u * 0.3, track - u * 0.1, u * 0.17);
          wheel(x1 + u * 0.9, track - u * 0.1, u * 0.17);
        });
        // engine
        const ex = front - u * 1.7;
        ctx.fillStyle = "#e84a5f";
        ctx.fillRect(ex, track - u * 0.75, u * 1.6, u * 0.6);
        ctx.fillRect(ex, track - u * 1.35, u * 0.65, u * 0.62);
        ctx.fillStyle = "#3a3a46";
        ctx.fillRect(ex + u * 1.1, track - u * 1.2, u * 0.22, u * 0.48);
        ctx.fillRect(ex - u * 0.05, track - u * 1.45, u * 0.75, u * 0.12);
        ctx.fillStyle = "#bfe6ff";
        ctx.fillRect(ex + u * 0.12, track - u * 1.22, u * 0.4, u * 0.3);
        animal(ctx, "panda", ex + u * 0.32, track - u * 1.02, u * 0.17, blinkAt(ts, 7), 0);
        ctx.fillStyle = "#e84a5f";
        ctx.fillRect(ex + u * 0.12, track - u * 0.92, u * 0.4, u * 0.18);
        ctx.fillStyle = "#ffd166";
        ctx.beginPath();
        ctx.moveTo(ex + u * 1.6, track - u * 0.15);
        ctx.lineTo(ex + u * 1.95, track - u * 0.05);
        ctx.lineTo(ex + u * 1.6, track - u * 0.4);
        ctx.fill();
        wheel(ex + u * 0.35, track - u * 0.1, u * 0.2);
        wheel(ex + u * 1.2, track - u * 0.1, u * 0.2);
        const smoke = once("smoke", () => []);
        if (Math.random() < dt * (2 + bass * 3) && smoke.length < 20) smoke.push({ x: ex + u * 1.21, y: track - u * 1.25, r: u * 0.12, life: 1 });
        for (let i = smoke.length - 1; i >= 0; i--) {
          const p = smoke[i];
          p.life -= dt * 0.4;
          if (p.life <= 0) {
            smoke.splice(i, 1);
            continue;
          }
          p.y -= dt * u * 0.6;
          p.x -= dt * u * 0.3;
          p.r += dt * u * 0.15;
          circ(ctx, p.x, p.y, p.r, `rgba(255,255,255,${0.85 * p.life})`);
        }
      } else if (mode === "duckies") {
        ctx.globalAlpha = GA;
        skyFill("#bfe9ff", "#e9f8ff");
        sunFace(w * 0.85, h * 0.17, m * 0.06);
        driftClouds("duckClouds", 3, "#ffffff", 0.01, 0.045);
        const wy = (x, k = 0) => h * (0.6 + k * 0.08) + Math.sin((x / w) * 8 + ts * 1.1 + k) * h * 0.016 + Math.sin((x / w) * 3 - ts * 0.6) * h * 0.012 * (1 + bass * 0.6);
        const water = (k, c) => {
          ctx.fillStyle = c;
          ctx.beginPath();
          ctx.moveTo(0, h);
          for (let x = 0; x <= w + 10; x += 10) ctx.lineTo(x, wy(x, k));
          ctx.lineTo(w, h);
          ctx.fill();
        };
        water(0, "#5bbbe8");
        const ducks = once("ducks", () => Array.from({ length: 5 }, (_, i) => ({ x: i / 5 + rand(0, 0.1), s: rand(0.8, 1.1), p: rand(0, 6.28) })));
        for (const d of ducks) {
          d.x += dt * 0.018;
          if (d.x > 1.15) d.x = -0.15;
          const x = d.x * w, r = m * 0.085 * d.s, y = wy(x) - r * 0.25;
          const slope = Math.atan2(wy(x + 10) - wy(x - 10), 20);
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate(slope + Math.sin(ts * 2 + d.p) * 0.05);
          ctx.fillStyle = "#ffd93b";
          ctx.beginPath();
          ctx.moveTo(-r * 0.9, -r * 0.1);
          ctx.lineTo(-r * 1.25, -r * 0.55);
          ctx.lineTo(-r * 0.6, -r * 0.35);
          ctx.fill();
          ell(ctx, 0, 0, r, r * 0.6, 0, "#ffd93b");
          ell(ctx, -r * 0.1, -r * 0.05, r * 0.45, r * 0.28, -0.2, "#ffc61a");
          circ(ctx, r * 0.55, -r * 0.65, r * 0.42, "#ffd93b");
          ell(ctx, r * 1.0, -r * 0.55, r * 0.22, r * 0.1, 0.1, "#ff8a2b");
          circ(ctx, r * 0.68, -r * 0.75, r * 0.07, INK);
          circ(ctx, r * 0.7, -r * 0.78, r * 0.03, "#fff");
          ell(ctx, r * 0.55, -r * 0.5, r * 0.08, r * 0.05, 0, "rgba(255,110,140,0.5)");
          ctx.restore();
        }
        ctx.globalAlpha = GA * 0.75;
        water(1, "#3fa5dc");
        ctx.globalAlpha = GA;
        for (let i = 0; i < 12; i++) {
          const x = ((i * 0.37 + ts * 0.02) % 1) * w, y = wy(x, 1) + h * 0.06 + (i % 3) * h * 0.04;
          ctx.fillStyle = `rgba(255,255,255,${0.35 + 0.3 * Math.sin(ts * 2 + i)})`;
          ctx.fillRect(x, y, 14 * k7, 2 * k7);
        }
      } else if (mode === "peekaboo") {
        ctx.globalAlpha = GA;
        skyFill("#ffe9f3", "#e6f3ff");
        sunFace(w * 0.5, h * 0.16, m * 0.06);
        const slots = once("peek", () => Array.from({ length: 4 }, (_, i) => ({ p: 0, dir: 0, hold: 0, kind: ANIMALS[i] })));
        if (beat || Math.random() < dt * 0.8) {
          const idle = slots.filter((s) => s.dir === 0 && s.p === 0);
          if (idle.length) {
            const s = idle[Math.floor(Math.random() * idle.length)];
            s.dir = 1;
            s.kind = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
          }
        }
        const r = Math.min(w / 11, h * 0.13), by = h * 0.78;
        slots.forEach((s, i) => {
          s.p += s.dir * dt * 2.2;
          if (s.p >= 1 && s.dir === 1) {
            s.p = 1;
            s.dir = 0;
            s.hold = 1.4;
          }
          if (s.hold > 0) {
            s.hold -= dt;
            if (s.hold <= 0) s.dir = -1;
          }
          if (s.p <= 0 && s.dir === -1) {
            s.p = 0;
            s.dir = 0;
          }
          const e = s.p < 1 ? 1 + 2.7 * Math.pow(s.p - 1, 3) + 1.7 * Math.pow(s.p - 1, 2) : 1; // ease out back
          const x = (w * (i + 0.5)) / 4;
          if (s.p > 0) animal(ctx, s.kind, x, by + r * 0.4 - e * r * 1.5, r, blinkAt(ts, i), s.hold > 0 ? 0.8 : 0);
          if (s.hold > 0.3) {
            ctx.font = `800 ${Math.round(20 * k7)}px system-ui, sans-serif`;
            ctx.textAlign = "center";
            ctx.fillStyle = hsl(KIDS[i * 2], 1, 50, 90);
            ctx.fillText("Boo!", x, by - r * 2.9);
          }
          ctx.fillStyle = ["#5cc95c", "#4fb84f", "#66d066", "#52bf52"][i];
          cloud(ctx, x, by + r * 0.35, r * 0.75);
          ctx.fillRect(x - r * 1.4, by + r * 0.6, r * 2.8, h);
        });
        ctx.fillStyle = "#4fb84f";
        ctx.fillRect(0, by + r * 0.9, w, h);
      } else if (CAMERA.has(mode)) {
        const vid = cam.state === "live" && cam.video && cam.video.readyState >= 2 ? cam.video : null;
        if (!vid) {
          glowAt(w / 2, h / 2, m * 0.6, 0.45 * A * (0.4 + bass), 0);
          const msg =
            cam.state === "error" ? cam.err : cam.state === "pending" ? "Waiting for camera…" : preview ? "📷 Tap to turn on camera" : "Starting camera…";
          ctx.fillStyle = dark ? "rgba(255,255,255,0.85)" : "rgba(0,0,0,0.75)";
          ctx.font = `600 ${Math.max(11, 15 * k7)}px system-ui, sans-serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(msg, w / 2, h / 2);
          ctx.textBaseline = "alphabetic";
        } else {
          ctx.globalAlpha = Math.min(1, A * 1.3);
          if (mode === "cammirror") {
            const z = 1 + bass * 0.05 + flash * 0.03;
            ctx.save();
            ctx.translate(w / 2, h / 2);
            ctx.scale(z, z);
            ctx.translate(-w / 2, -h / 2);
            cover(ctx, vid, 0, 0, w, h);
            ctx.restore();
            ctx.globalCompositeOperation = "overlay";
            ctx.fillStyle = col(t * 15, 0.3 * (0.4 + bass));
            ctx.fillRect(0, 0, w, h);
            ctx.globalCompositeOperation = "lighter";
            const n = w < 400 ? 24 : 48, bw = w / n;
            for (let i = 0; i < n; i++) {
              const k = Math.abs(i - (n - 1) / 2) / (n / 2);
              const v = spec[Math.min(BINS - 1, Math.floor(k * BINS * 0.9))];
              ctx.fillStyle = col(k * 120, 0.55 * v, L + 10);
              ctx.fillRect(i * bw + 1, h - v * h * 0.22, bw - 2, v * h * 0.22);
            }
            glowAt(0, 0, m * (0.4 + bass * 0.4), 0.5 * (0.2 + flash * 0.6), 0);
            glowAt(w, h, m * (0.4 + bass * 0.4), 0.5 * (0.2 + flash * 0.6), 80);
          } else if (mode === "camcolor") {
            const z = 1 + bass * 0.04;
            ctx.save();
            ctx.filter = `hue-rotate(${Math.round(t * 30 + flash * 90) % 360}deg) saturate(${(2 + bass * 2).toFixed(2)}) contrast(1.3)`;
            ctx.translate(w / 2, h / 2);
            ctx.scale(z, z);
            ctx.translate(-w / 2, -h / 2);
            cover(ctx, vid, 0, 0, w, h);
            ctx.restore();
            ctx.filter = "none";
          } else if (mode === "campop") {
            const st = once("pop", () => ({ shift: 0 }));
            if (beat) st.shift++;
            for (let q = 0; q < 4; q++) {
              const qx = (q % 2) * (w / 2), qy = Math.floor(q / 2) * (h / 2);
              ctx.save();
              ctx.beginPath();
              ctx.rect(qx, qy, w / 2, h / 2);
              ctx.clip();
              cover(ctx, vid, qx, qy, w / 2, h / 2);
              ctx.globalCompositeOperation = "color";
              ctx.fillStyle = hsl(st.shift * 40 + q * 90, 1, 50, 95);
              ctx.fillRect(qx, qy, w / 2, h / 2);
              ctx.restore();
            }
            ctx.fillStyle = `rgba(255,255,255,${0.6 + flash * 0.4})`;
            const lw = Math.max(2, 4 * k7);
            ctx.fillRect(w / 2 - lw / 2, 0, lw, h);
            ctx.fillRect(0, h / 2 - lw / 2, w, lw);
          } else if (mode === "campixel") {
            const pc = once("pixcam", () => document.createElement("canvas"));
            const cols = Math.max(16, Math.round(72 - bass * 45));
            const rows = Math.max(9, Math.round((cols * h) / Math.max(1, w)));
            if (pc.width !== cols || pc.height !== rows) {
              pc.width = cols;
              pc.height = rows;
            }
            cover(pc.getContext("2d"), vid, 0, 0, cols, rows);
            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(pc, 0, 0, w, h);
            ctx.imageSmoothingEnabled = true;
            ctx.strokeStyle = "rgba(0,0,0,0.22)";
            ctx.lineWidth = 1;
            ctx.beginPath();
            for (let i = 1; i < cols; i++) {
              ctx.moveTo((i * w) / cols, 0);
              ctx.lineTo((i * w) / cols, h);
            }
            for (let i = 1; i < rows; i++) {
              ctx.moveTo(0, (i * h) / rows);
              ctx.lineTo(w, (i * h) / rows);
            }
            ctx.stroke();
          } else if (mode === "camkaleido") {
            const seg = 8, half = Math.PI / seg, R = Math.hypot(w, h) / 2;
            const vw = vid.videoWidth || 640, vh = vid.videoHeight || 480;
            const s = (R * 1.3 * (1 + bass * 0.15)) / Math.min(vw, vh), dw = vw * s, dh = vh * s;
            for (let i = 0; i < seg; i++) {
              ctx.save();
              ctx.translate(w / 2, h / 2);
              ctx.rotate(i * 2 * half + t * 0.1);
              if (i % 2) ctx.scale(1, -1);
              ctx.beginPath();
              ctx.moveTo(0, 0);
              ctx.lineTo(Math.cos(-half) * R * 1.2, Math.sin(-half) * R * 1.2);
              ctx.lineTo(Math.cos(half) * R * 1.2, Math.sin(half) * R * 1.2);
              ctx.closePath();
              ctx.clip();
              ctx.rotate(Math.sin(t * 0.3) * 0.3);
              ctx.drawImage(vid, -dw * 0.3, -dh / 2, dw, dh);
              ctx.restore();
            }
            glowAt(w / 2, h / 2, m * (0.15 + bass * 0.2), 0.5 * (0.3 + bass), 30);
          } else if (mode === "camecho") {
            const tc = once("echo", () => document.createElement("canvas"));
            const cw = Math.max(1, Math.round(w)), chh = Math.max(1, Math.round(h));
            if (tc.width !== cw || tc.height !== chh) {
              tc.width = cw;
              tc.height = chh;
            }
            const tx = tc.getContext("2d");
            tx.globalAlpha = Math.min(1, 0.1 + bass * 0.2 + flash * 0.3);
            cover(tx, vid, 0, 0, cw, chh);
            tx.globalAlpha = 1;
            ctx.drawImage(tc, 0, 0, w, h);
            ctx.globalCompositeOperation = "overlay";
            ctx.fillStyle = col(t * 20, 0.4);
            ctx.fillRect(0, 0, w, h);
          }
          ctx.globalAlpha = 1;
        }
      }
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 1;
      raf = reduced ? 0 : requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    // Reduced motion: redraw a single still frame now and then.
    const still = reduced ? setInterval(() => requestAnimationFrame(draw), 1000) : 0;
    return () => {
      cancelAnimationFrame(raf);
      clearInterval(still);
      if (camHeld) camRelease();
      ro.disconnect();
      io.disconnect();
    };
  }, [analyserRef]);

  return <canvas ref={canvasRef} aria-hidden className={`pointer-events-none block h-full w-full ${className}`} />;
}

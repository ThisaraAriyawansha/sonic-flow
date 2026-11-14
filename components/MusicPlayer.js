"use client";

import { useRef, useState } from "react";

export default function MusicPlayer() {
  const audioRef = useRef(null);
  const ctxRef = useRef(null);
  const bassRef = useRef(null);
  const trebleRef = useRef(null);

  const [tracks, setTracks] = useState([]);
  const [current, setCurrent] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [bass, setBass] = useState(0);
  const [treble, setTreble] = useState(0);

  const initAudio = () => {
    if (ctxRef.current) return;
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const source = ctx.createMediaElementSource(audioRef.current);

    const bassFilter = ctx.createBiquadFilter();
    bassFilter.type = "lowshelf";
    bassFilter.frequency.value = 200;
    bassFilter.gain.value = bass;

    const trebleFilter = ctx.createBiquadFilter();
    trebleFilter.type = "highshelf";
    trebleFilter.frequency.value = 3000;
    trebleFilter.gain.value = treble;

    source.connect(bassFilter);
    bassFilter.connect(trebleFilter);
    trebleFilter.connect(ctx.destination);

    ctxRef.current = ctx;
    bassRef.current = bassFilter;
    trebleRef.current = trebleFilter;
  };

  const handleUpload = (e) => {
    const files = Array.from(e.target.files || []);
    const newTracks = files
      .filter((f) => f.type.startsWith("audio/"))
      .map((f) => ({ name: f.name.replace(/\.[^/.]+$/, ""), url: URL.createObjectURL(f) }));
    if (!newTracks.length) return;
    setTracks((prev) => [...prev, ...newTracks]);
    e.target.value = "";
  };

  const playIndex = (index) => {
    initAudio();
    setCurrent(index);
    setPlaying(true);
    setTimeout(() => {
      ctxRef.current?.resume();
      audioRef.current?.play();
    }, 0);
  };

  const togglePlay = () => {
    if (!tracks.length) return;
    initAudio();
    ctxRef.current.resume();
    const audio = audioRef.current;
    if (audio.paused) {
      audio.play();
      setPlaying(true);
    } else {
      audio.pause();
      setPlaying(false);
    }
  };

  const next = () => {
    if (!tracks.length) return;
    playIndex((current + 1) % tracks.length);
  };

  const prev = () => {
    if (!tracks.length) return;
    playIndex((current - 1 + tracks.length) % tracks.length);
  };

  const seek = (e) => {
    const t = Number(e.target.value);
    audioRef.current.currentTime = t;
    setTime(t);
  };

  const changeVolume = (e) => {
    const v = Number(e.target.value);
    setVolume(v);
    audioRef.current.volume = v;
  };

  const changeBass = (e) => {
    const v = Number(e.target.value);
    setBass(v);
    if (bassRef.current) bassRef.current.gain.value = v;
  };

  const changeTreble = (e) => {
    const v = Number(e.target.value);
    setTreble(v);
    if (trebleRef.current) trebleRef.current.gain.value = v;
  };

  const resetEq = () => {
    setBass(0);
    setTreble(0);
    if (bassRef.current) bassRef.current.gain.value = 0;
    if (trebleRef.current) trebleRef.current.gain.value = 0;
  };

  const fmt = (s) => {
    if (!s || isNaN(s)) return "0:00";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60).toString().padStart(2, "0");
    return `${m}:${sec}`;
  };

  return (
    <div className="mx-auto w-full max-w-xl p-6 text-white">
      <div className="rounded-2xl bg-neutral-900 p-6 shadow-xl">
        <h1 className="mb-4 text-2xl font-bold">Music Player</h1>

        <label className="mb-6 flex cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-neutral-600 p-4 text-neutral-300 hover:border-white">
          + Upload MP3 / audio files
          <input
            type="file"
            accept="audio/*"
            multiple
            onChange={handleUpload}
            className="hidden"
          />
        </label>

        <audio
          ref={audioRef}
          src={tracks[current]?.url}
          onTimeUpdate={(e) => setTime(e.target.currentTime)}
          onLoadedMetadata={(e) => setDuration(e.target.duration)}
          onEnded={next}
        />

        <div className="mb-2 truncate text-center text-lg font-semibold">
          {tracks[current]?.name || "No track selected"}
        </div>

        <input
          type="range"
          min={0}
          max={duration || 0}
          step={0.1}
          value={time}
          onChange={seek}
          className="w-full"
        />
        <div className="mb-4 flex justify-between text-xs text-neutral-400">
          <span>{fmt(time)}</span>
          <span>{fmt(duration)}</span>
        </div>

        <div className="mb-6 flex items-center justify-center gap-4">
          <button onClick={prev} className="rounded-full bg-neutral-800 px-4 py-2 hover:bg-neutral-700">
            ⏮
          </button>
          <button
            onClick={togglePlay}
            className="rounded-full bg-white px-6 py-3 font-bold text-black hover:bg-neutral-200"
          >
            {playing ? "⏸ Pause" : "▶ Play"}
          </button>
          <button onClick={next} className="rounded-full bg-neutral-800 px-4 py-2 hover:bg-neutral-700">
            ⏭
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm">
              <span>Volume</span>
              <span>{Math.round(volume * 100)}%</span>
            </div>
            <input type="range" min={0} max={1} step={0.01} value={volume} onChange={changeVolume} className="w-full" />
          </div>

          <div>
            <div className="flex justify-between text-sm">
              <span>Bass</span>
              <span>{bass} dB</span>
            </div>
            <input type="range" min={-15} max={15} step={1} value={bass} onChange={changeBass} className="w-full" />
          </div>

          <div>
            <div className="flex justify-between text-sm">
              <span>Treble</span>
              <span>{treble} dB</span>
            </div>
            <input type="range" min={-15} max={15} step={1} value={treble} onChange={changeTreble} className="w-full" />
          </div>

          <button onClick={resetEq} className="text-sm text-neutral-400 underline hover:text-white">
            Reset EQ
          </button>
        </div>

        {tracks.length > 0 && (
          <ul className="mt-6 max-h-60 divide-y divide-neutral-800 overflow-y-auto rounded-xl bg-neutral-800">
            {tracks.map((t, i) => (
              <li
                key={t.url}
                onClick={() => playIndex(i)}
                className={`cursor-pointer truncate px-4 py-3 text-sm hover:bg-neutral-700 ${
                  i === current ? "font-bold text-green-400" : ""
                }`}
              >
                {i + 1}. {t.name}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

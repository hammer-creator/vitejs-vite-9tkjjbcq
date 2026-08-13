import { useCallback, useEffect, useRef, useState } from "react";
import { Pause, Play, RotateCcw, Minus, Plus, Bell } from "lucide-react";

const DEFAULT_SECONDS = 120;

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function playBeep() {
  try {
    const ctx = new AudioContext();
    const playTone = (freq: number, start: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = freq;
      osc.type = "sine";
      gain.gain.setValueAtTime(0, ctx.currentTime + start);
      gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + start);
      osc.stop(ctx.currentTime + start + duration);
    };
    playTone(880, 0, 0.15);
    playTone(880, 0.2, 0.15);
    playTone(1100, 0.4, 0.25);
    setTimeout(() => ctx.close(), 1000);
  } catch {
    // AudioContext not available
  }
}

function vibrate() {
  try {
    if ("vibrate" in navigator) {
      navigator.vibrate([200, 100, 200, 100, 400]);
    }
  } catch {
    // ignore
  }
}

export interface RestTimerHandle {
  start: () => void;
}

interface RestTimerProps {
  registerHandle: (handle: RestTimerHandle) => void;
}

export function RestTimer({ registerHandle }: RestTimerProps) {
  const [duration, setDuration] = useState(DEFAULT_SECONDS);
  const [remaining, setRemaining] = useState(DEFAULT_SECONDS);
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setRunning(false);
  }, []);

  const reset = useCallback(() => {
    stop();
    setRemaining(duration);
    setFinished(false);
  }, [duration, stop]);

  const start = useCallback(() => {
    stop();
    setFinished(false);
    setRemaining((prev) => (prev <= 0 ? duration : prev));
    setRunning(true);
  }, [duration, stop]);

  // Register handle with parent
  useEffect(() => {
    registerHandle({ start });
  }, [start, registerHandle]);

  // Tick
  useEffect(() => {
    if (!running) return;
    intervalRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!);
          intervalRef.current = null;
          setRunning(false);
          setFinished(true);
          playBeep();
          vibrate();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running]);

  const adjustDuration = (delta: number) => {
    setDuration((prev) => {
      const next = Math.max(30, Math.min(600, prev + delta));
      if (!running && !finished) setRemaining(next);
      return next;
    });
  };

  const progress = duration > 0 ? remaining / duration : 0;
  const circumference = 2 * Math.PI * 42;
  const strokeDashoffset = circumference * (1 - progress);

  // Don't render if idle and never started
  if (!running && !finished && remaining === duration) {
    return (
      <div className="fixed bottom-4 left-1/2 z-30 -translate-x-1/2">
        <button
          onClick={start}
          className="flex items-center gap-2 rounded-full border border-zinc-700 bg-zinc-900/90 px-4 py-2.5 text-sm font-medium text-zinc-300 shadow-lg backdrop-blur-md transition hover:border-teal-600 hover:text-teal-400"
        >
          <Play className="h-4 w-4" />
          Таймер отдыха · {formatTime(duration)}
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 left-1/2 z-30 -translate-x-1/2">
      <div
        className={`flex items-center gap-3 rounded-2xl border bg-zinc-900/95 px-4 py-3 shadow-2xl backdrop-blur-md transition-colors ${
          finished
            ? "border-teal-500/60 shadow-teal-500/20"
            : "border-zinc-700"
        }`}
      >
        {/* Circular progress */}
        <div className="relative h-12 w-12 flex-shrink-0">
          <svg className="h-12 w-12 -rotate-90" viewBox="0 0 96 96">
            <circle
              cx="48"
              cy="48"
              r="42"
              fill="none"
              stroke="currentColor"
              strokeWidth="6"
              className="text-zinc-800"
            />
            <circle
              cx="48"
              cy="48"
              r="42"
              fill="none"
              stroke="currentColor"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className={finished ? "text-teal-400" : "text-teal-500"}
              style={{ transition: "stroke-dashoffset 1s linear" }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            {finished ? (
              <Bell className="h-5 w-5 animate-pulse text-teal-400" />
            ) : (
              <span className="text-xs font-bold text-white">
                {formatTime(remaining)}
              </span>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => adjustDuration(-30)}
            className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-800 text-zinc-400 transition hover:bg-zinc-700 hover:text-white"
            title="-30 сек"
          >
            <Minus className="h-3.5 w-3.5" />
          </button>
          <span className="min-w-[35px] text-center text-xs font-medium text-zinc-400">
            {formatTime(duration)}
          </span>
          <button
            onClick={() => adjustDuration(30)}
            className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-800 text-zinc-400 transition hover:bg-zinc-700 hover:text-white"
            title="+30 сек"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Play/Pause/Reset */}
        {finished ? (
          <button
            onClick={reset}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-500 text-white transition hover:bg-teal-400"
            title="Сбросить"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        ) : running ? (
          <button
            onClick={stop}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-800 text-white transition hover:bg-zinc-700"
            title="Пауза"
          >
            <Pause className="h-4 w-4" />
          </button>
        ) : (
          <button
            onClick={start}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-500 text-white transition hover:bg-teal-400"
            title="Старт"
          >
            <Play className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}

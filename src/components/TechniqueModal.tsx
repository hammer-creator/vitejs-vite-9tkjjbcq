import { useEffect } from "react";
import { X, Info, CheckCircle2 } from "lucide-react";
import { getTechniqueTips } from "@/lib/techniqueTips";

interface TechniqueModalProps {
  exerciseName: string;
  onClose: () => void;
}

export function TechniqueModal({ exerciseName, onClose }: TechniqueModalProps) {
  const tips = getTechniqueTips(exerciseName);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md animate-[slideUp_0.25s_ease-out] rounded-t-3xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle on mobile */}
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-zinc-700 sm:hidden" />

        <div className="mb-4 flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-500/15">
              <Info className="h-5 w-5 text-teal-400" />
            </div>
            <div>
              <p className="text-xs text-zinc-500">Техника выполнения</p>
              <h3 className="text-base font-semibold text-white">
                {exerciseName}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-500 transition hover:bg-zinc-800 hover:text-zinc-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-3">
          {tips.map((tip, i) => (
            <div
              key={i}
              className="flex items-start gap-3 rounded-xl border border-zinc-800 bg-zinc-800/40 px-4 py-3"
            >
              <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-teal-400" />
              <p className="text-sm leading-relaxed text-zinc-300">{tip}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

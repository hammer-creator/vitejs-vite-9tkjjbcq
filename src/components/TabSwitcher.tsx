import { Dumbbell, History } from "lucide-react";

export type TabId = "current" | "history";

interface TabSwitcherProps {
  active: TabId;
  onChange: (tab: TabId) => void;
  historyCount: number;
}

export function TabSwitcher({
  active,
  onChange,
  historyCount,
}: TabSwitcherProps) {
  return (
    <div className="mx-auto mb-6 flex w-full max-w-xs items-center gap-1 rounded-2xl border border-zinc-800 bg-zinc-900/80 p-1">
      <button
        onClick={() => onChange("current")}
        className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium transition-all ${
          active === "current"
            ? "bg-teal-500 text-white shadow-lg shadow-teal-500/20"
            : "text-zinc-400 hover:text-zinc-200"
        }`}
      >
        <Dumbbell className="h-4 w-4" />
        Тренировка
      </button>
      <button
        onClick={() => onChange("history")}
        className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium transition-all ${
          active === "history"
            ? "bg-teal-500 text-white shadow-lg shadow-teal-500/20"
            : "text-zinc-400 hover:text-zinc-200"
        }`}
      >
        <History className="h-4 w-4" />
        История
        {historyCount > 0 && (
          <span
            className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
              active === "history"
                ? "bg-white/20 text-white"
                : "bg-zinc-800 text-zinc-400"
            }`}
          >
            {historyCount}
          </span>
        )}
      </button>
    </div>
  );
}

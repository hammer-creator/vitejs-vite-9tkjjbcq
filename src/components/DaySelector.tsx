import { useEffect, useRef } from "react";

interface DaySelectorProps {
  days: string[];
  activeDay: number;
  todayIndex: number;
  onSelect: (day: number) => void;
}

export function DaySelector({
  days,
  activeDay,
  todayIndex,
  onSelect,
}: DaySelectorProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLButtonElement>(null);

  // Scroll active day into view when it changes
  useEffect(() => {
    if (activeRef.current && scrollRef.current) {
      const container = scrollRef.current;
      const button = activeRef.current;
      const containerRect = container.getBoundingClientRect();
      const buttonRect = button.getBoundingClientRect();

      // Only scroll if button is not fully visible
      const isVisible =
        buttonRect.left >= containerRect.left &&
        buttonRect.right <= containerRect.right;

      if (!isVisible) {
        container.scrollTo({
          left:
            button.offsetLeft -
            container.offsetWidth / 2 +
            button.offsetWidth / 2,
          behavior: "smooth",
        });
      }
    }
  }, [activeDay]);

  return (
    <div
      ref={scrollRef}
      className="hide-scrollbar -mx-3 mb-4 flex gap-1.5 overflow-x-auto px-3 pb-1"
    >
      {days.map((day, i) => {
        const isToday = i === todayIndex;
        const isActive = i === activeDay;

        return (
          <button
            key={i}
            ref={isActive ? activeRef : undefined}
            onClick={() => onSelect(i)}
            className={`relative flex h-11 min-w-[44px] flex-shrink-0 flex-col items-center justify-center rounded-xl px-3 text-sm font-semibold transition-all ${
              isActive
                ? "bg-teal-500 text-white shadow-lg shadow-teal-500/20"
                : "border border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
            }`}
          >
            {day}
            {isToday && (
              <span
                className={`absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full ${
                  isActive ? "bg-white" : "bg-teal-400"
                }`}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}

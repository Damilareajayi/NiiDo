"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { COUNTRIES } from "@/lib/constants";

interface CountrySelectProps {
  value: string; // ISO code, e.g. "NG"
  onChange: (iso: string) => void;
}

// A native <select> can't reliably show flag icons in its (OS-rendered) option
// list, and flag emoji don't render on most Windows/Chrome combos at all — so
// this renders real SVG flags via the flag-icons package instead.
export function CountrySelect({ value, onChange }: CountrySelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const country = COUNTRIES.find((c) => c.iso === value) || COUNTRIES[0];

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div className="relative shrink-0" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="input w-28 flex items-center gap-1.5 justify-between"
      >
        <span className="flex items-center gap-1.5 min-w-0">
          <span className={`fi fi-${country.iso.toLowerCase()} rounded-sm shrink-0`} />
          <span className="text-sm truncate">{country.dialCode}</span>
        </span>
        <ChevronDown className="w-3.5 h-3.5 text-stone-400 shrink-0" />
      </button>

      {open && (
        <div className="absolute z-20 mt-1 w-64 max-h-64 overflow-y-auto bg-white border border-stone-200 rounded-xl shadow-lg py-1">
          {COUNTRIES.map((c) => (
            <button
              key={c.iso}
              type="button"
              onClick={() => { onChange(c.iso); setOpen(false); }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left hover:bg-stone-50 transition-colors
                ${c.iso === value ? "bg-brand-50 text-brand-700 font-medium" : "text-stone-700"}`}
            >
              <span className={`fi fi-${c.iso.toLowerCase()} rounded-sm shrink-0`} />
              <span className="flex-1 truncate">{c.name}</span>
              <span className="text-stone-400 shrink-0">{c.dialCode}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

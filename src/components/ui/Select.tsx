"use client";

import React from "react";

type Option = { label: string; value: string | number };

export function Select({
  label,
  value,
  onChange,
  options,
}: {
  label?: string;
  value: string | number;
  onChange: (v: string) => void;
  options: Option[];
}) {
  return (
    <label className="block">
      {label && <div className="mb-1 text-sm font-medium text-gray-900">{label}</div>}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/10"
      >
        {options.map((o) => (
          <option key={String(o.value)} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

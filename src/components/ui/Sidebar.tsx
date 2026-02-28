"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/menu", label: "Menu" },
  { href: "/orders", label: "Orders" },
  { href: "/reports", label: "Reports" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-full md:w-64 md:min-h-screen border-r border-gray-500 bg-[#042f2e]">
      <div className="p-5">
        <div className="rounded-2xl bg-black px-4 py-3 text-white">
          <div className="text-sm opacity-80">Cafe Admin</div>
          <div className="text-lg font-bold">Dashboard</div>
        </div>

        <nav className="mt-5 space-y-2">
          {items.map((it) => {
            const active = pathname === it.href;
            return (
              <Link
                key={it.href}
                href={it.href}
                className={`block rounded-xl px-4 py-3 text-sm font-semibold transition ${
                  active ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900 hover:bg-gray-100"
                }`}
              >
                {it.label}
              </Link>
            );
          })}
        </nav>

        {/* <div className="mt-6 rounded-2xl bg-gray-50 p-4 text-xs text-gray-600">
          Tip: Create categories + product types first, then add products with variants.
        </div> */}
      </div>
    </aside>
  );
}

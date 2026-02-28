"use client";

import { useMemo, useState } from "react";
import { CategoriesPanel } from "@/components/menu/CategoriesPanel";
import { ProductTypesPanel } from "@/components/menu/ProductTypesPanel";
import { ProductsPanel } from "@/components/menu/ProductsPanel";
import { MenuPreviewPanel } from "@/components/menu/MenuPreviewPanel";


const tabs = ["Categories","Products", "Product Types"] as const;
type Tab = (typeof tabs)[number];

export default function MenuPage() {
  const [tab, setTab] = useState<Tab>("Products");

  const content = useMemo(() => {
    switch (tab) {
      case "Categories":
        return <CategoriesPanel />;
      case "Product Types":
        return <ProductTypesPanel />;
      case "Products":
        return <ProductsPanel />;
      // case "Menu Preview":
      //   return <MenuPreviewPanel />;
    }
  }, [tab]);

  return (
    <div>
      <div className="rounded-2xl bg-[#059669] p-6 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Menu Manager</h1>
            {/* <p className="mt-1 text-sm text-gray-800">
              Manage categories, hot/iced types, products, and variants — then preview the final menu JSON.
            </p> */}
          </div>
          <div className="flex flex-wrap gap-2">
            {tabs.map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                  tab === t ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-900 hover:bg-gray-200"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6">{content}</div>
    </div>
  );
}

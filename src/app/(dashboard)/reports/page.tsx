"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Title,
} from "chart.js";
import { Line, Bar, Doughnut } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Title
);

type DailySales = { date: string; total: number; orders: number };
type TopItem = { name: string; qty: number };
type SalesByType = { type: string; total: number };

type ReportsResp = {
  currency: string;
  totals: { revenue: number; orders: number; avgOrder: number };
  daily: DailySales[];
  topItems: TopItem[];
  byType: SalesByType[];
  range?: { key?: string; from?: string | null; to?: string | null };
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL!;

const COLORS = {
  coffee: "rgb(79,34,6)",
  coffeeSoft: "rgba(79,34,6,.25)",
  latte: "rgb(153,97,63)",
  latteSoft: "rgba(153,97,63,.25)",
  cream: "rgb(246,239,232)",
  green: "rgb(0,155,5)",
  greenSoft: "rgba(0,155,5,.25)",
};

export default function ReportsPage() {
  const [loading, setLoading] = useState(true);

  // preset mode
  const [range, setRange] = useState<"day" | "week" | "month" | "30d">("week");

  // custom mode
  const [useCustom, setUseCustom] = useState(false);
  const [from, setFrom] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [to, setTo] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [queryKey, setQueryKey] = useState<string>("range=week"); // triggers fetch

  const [daily, setDaily] = useState<DailySales[]>([]);
  const [topItems, setTopItems] = useState<TopItem[]>([]);
  const [byType, setByType] = useState<SalesByType[]>([]);

  const [revenue, setRevenue] = useState(0);
  const [ordersCount, setOrdersCount] = useState(0);
  const [avgOrder, setAvgOrder] = useState(0);

  function applyPreset(next: typeof range) {
    setUseCustom(false);
    setRange(next);
    setQueryKey(`range=${next}`);
  }

  function applyCustom() {
    if (!from || !to) return;
    if (from > to) return alert("From must be <= To");
    setUseCustom(true);
    setQueryKey(`from=${from}&to=${to}`);
  }

  useEffect(() => {
    const ctrl = new AbortController();

    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/reports?${queryKey}`, {
          cache: "no-store",
          headers: { Accept: "application/json" },
          signal: ctrl.signal,
        });

        if (!res.ok) throw new Error(await res.text());
        const data: ReportsResp = await res.json();

        setDaily(data.daily ?? []);
        setTopItems(data.topItems ?? []);
        setByType(data.byType ?? []);

        setRevenue(Number(data?.totals?.revenue ?? 0));
        setOrdersCount(Number(data?.totals?.orders ?? 0));
        setAvgOrder(Number(data?.totals?.avgOrder ?? 0));
      } catch (e: any) {
        if (e?.name === "AbortError") return;
        console.error(e);
        setDaily([]);
        setTopItems([]);
        setByType([]);
        setRevenue(0);
        setOrdersCount(0);
        setAvgOrder(0);
      } finally {
        setLoading(false);
      }
    })();

    return () => ctrl.abort();
  }, [queryKey]);

  const titleLabel = useMemo(() => {
    if (useCustom) return `${from} → ${to}`;
    if (range === "day") return "Today";
    if (range === "week") return "Last 7 days";
    if (range === "month") return "This month";
    return "Last 30 days";
  }, [useCustom, range, from, to]);

  const labels = daily.map((d) => d.date);

  const lineData = {
    labels,
    datasets: [
      {
        label: "Revenue (USD)",
        data: daily.map((d) => d.total),
        tension: 0.35,
        borderColor: COLORS.coffee,
        backgroundColor: COLORS.coffeeSoft,
        pointBackgroundColor: COLORS.coffee,
        pointBorderColor: COLORS.cream,
        pointRadius: 4,
        fill: true,
      },
    ],
  };

  const lineOptions = {
    responsive: true,
    plugins: { legend: { display: true } },
    scales: {
      y: { grid: { color: "rgba(0,0,0,0.06)" } },
      x: { grid: { display: false } },
    },
  };

  const barData = {
    labels: topItems.map((t) => t.name),
    datasets: [
      {
        label: "Qty sold",
        data: topItems.map((t) => t.qty),
        backgroundColor: COLORS.latteSoft,
        borderColor: COLORS.latte,
        borderWidth: 1,
        borderRadius: 10,
      },
    ],
  };

  const barOptions = {
    responsive: true,
    plugins: { legend: { display: true } },
    scales: {
      y: { grid: { color: "rgba(0,0,0,0.06)" } },
      x: { grid: { display: false } },
    },
  };

  const donutData = {
    labels: byType.map((x) => x.type),
    datasets: [
      {
        label: "Sales by Type",
        data: byType.map((x) => x.total),
        backgroundColor: [COLORS.coffeeSoft, COLORS.latteSoft, COLORS.greenSoft, "rgba(0,0,0,0.08)"],
        borderColor: [COLORS.coffee, COLORS.latte, COLORS.green, "rgba(0,0,0,0.25)"],
        borderWidth: 2,
      },
    ],
  };

  const donutOptions = {
    responsive: true,
    cutout: "65%",
    plugins: { legend: { position: "bottom" as const } },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl bg-[#059669] p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#042f2e]">Reports</h1>
            <div className="text-sm text-[#042f2e]/80">{titleLabel}</div>
          </div>

          <div className="flex flex-col gap-3 md:flex-row md:items-end">
            {/* Preset */}
            <label className="block">
              <div className="mb-1 text-sm font-semibold text-[#042f2e]">Preset</div>
              <select
                value={useCustom ? "" : range}
                onChange={(e) => applyPreset(e.target.value as any)}
                className="w-full md:w-56 rounded-xl border border-black/10 bg-white px-3 py-2 text-sm font-semibold text-[#4f2206]"
              >
                <option value="day">Today</option>
                <option value="week">Last 7 days</option>
                <option value="month">This month</option>
                <option value="30d">Last 30 days</option>
              </select>
            </label>

            {/* Custom range */}
            <div className="flex items-end gap-2">
              <label className="block">
                <div className="mb-1 text-sm font-semibold text-[#042f2e]">From</div>
                <input
                  type="date"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-black"
                />
              </label>

              <label className="block">
                <div className="mb-1 text-sm font-semibold text-[#042f2e]">To</div>
                <input
                  type="date"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-black"
                />
              </label>

              <button
                onClick={applyCustom}
                className="h-[40px] rounded-xl bg-[#4f2206] px-4 text-sm font-extrabold text-white hover:opacity-95"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card title="Revenue" value={`$${revenue.toFixed(2)}`} />
        <Card title="Orders" value={`${ordersCount}`} />
        <Card title="Avg Order Value" value={`$${avgOrder.toFixed(2)}`} />
      </div>

      {loading ? (
        <div className="rounded-2xl bg-white p-6 shadow-sm text-sm text-gray-600">Loading charts...</div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <div className="mb-3 font-bold text-red-400">Revenue Trend</div>
            <Line data={lineData} options={lineOptions} />
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <div className="mb-3 font-bold text-red-400">Top Items</div>
            <Bar data={barData} options={barOptions} />
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm lg:col-span-2">
            <div className="mb-3 font-bold text-red-400">Sales By Type</div>
            <div className="mx-auto max-w-sm">
              <Doughnut data={donutData} options={donutOptions} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Card({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm">
      <div className="text-xl text-green-800">{title}</div>
      <div className="mt-2 text-2xl font-bold text-red-600">{value}</div>
    </div>
  );
}
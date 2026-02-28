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

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL!;
  const COLORS = {
  coffee: "rgb(79,34,6)",        // dark brown
  coffeeSoft: "rgba(79,34,6,.25)",
  latte: "rgb(153,97,63)",       // latte brown
  latteSoft: "rgba(153,97,63,.25)",
  cream: "rgb(246,239,232)",     // very light
  green: "rgb(0,155,5)",
  greenSoft: "rgba(0,155,5,.25)",
};
export default function ReportsPage() {
  const [loading, setLoading] = useState(true);

  // ✅ later replace with API response
  const [daily, setDaily] = useState<DailySales[]>([]);
  const [topItems, setTopItems] = useState<TopItem[]>([]);
  const [byType, setByType] = useState<SalesByType[]>([]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        // ✅ later: fetch(`${API_BASE}/reports?range=7d`)
        // For now mock data:
        const mockDaily: DailySales[] = [
          { date: "Jan 02", total: 32.5, orders: 6 },
          { date: "Jan 03", total: 41.2, orders: 8 },
          { date: "Jan 04", total: 18.9, orders: 4 },
          { date: "Jan 05", total: 55.1, orders: 10 },
          { date: "Jan 06", total: 44.0, orders: 9 },
          { date: "Jan 07", total: 60.8, orders: 12 },
          { date: "Jan 08", total: 39.6, orders: 7 },
        ];

        const mockTop: TopItem[] = [
          { name: "Iced Latte", qty: 18 },
          { name: "Green Tea", qty: 13 },
          { name: "Americano", qty: 11 },
          { name: "Mocha", qty: 9 },
          { name: "Cappuccino", qty: 7 },
        ];

        const mockType: SalesByType[] = [
          { type: "Coffee", total: 210.4 },
          { type: "Tea", total: 98.2 },
          { type: "Other", total: 34.6 },
        ];

        setDaily(mockDaily);
        setTopItems(mockTop);
        setByType(mockType);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const totals = useMemo(() => {
    const revenue = daily.reduce((s, d) => s + d.total, 0);
    const orders = daily.reduce((s, d) => s + d.orders, 0);
    const avgOrder = orders ? revenue / orders : 0;
    return { revenue, orders, avgOrder };
  }, [daily]);

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
      backgroundColor: [COLORS.coffeeSoft, COLORS.latteSoft, COLORS.greenSoft],
      borderColor: [COLORS.coffee, COLORS.latte, COLORS.green],
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
      <div className="rounded-2xl bg-[#059669] p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-[#042f2e]">Reports</h1>
        {/* <p className="mt-1 text-sm text-gray-600">
          Sales analytics (Chart.js). Replace mock data with <span className="font-semibold">/api/reports</span> later.
        </p> */}
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card title="Revenue (7 days)" value={`$${totals.revenue.toFixed(2)}`} />
        <Card title="Orders (7 days)" value={`${totals.orders}`} />
        <Card title="Avg Order Value" value={`$${totals.avgOrder.toFixed(2)}`} />
      </div>

      {loading ? (
        <div className="rounded-2xl bg-white p-6 shadow-sm text-sm text-gray-600">Loading charts...</div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <div className="mb-3 font-bold">Revenue Trend</div>
            <Line
              data={lineData}
             options={lineOptions}
            />
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <div className="mb-3 font-bold">Top Items</div>
            <Bar
              data={barData}
              options={barOptions}
            />
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm lg:col-span-2">
            <div className="mb-3 font-bold">Sales By Type</div>
            <div className="mx-auto max-w-sm">
              <Doughnut
                data={donutData}
               options={donutOptions}
              />
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

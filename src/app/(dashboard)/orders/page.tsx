"use client";

import { useEffect, useMemo, useState } from "react";
import { makeEcho } from "@/lib/echo";
import { updateOrderStatus } from "@/lib/orders";

type OrderItem = { name: string; size: string; qty: number; price: number; sugar: string };
type Order = {
  id: number;
  reference: string;
  status: "pending" | "completed" | "cancelled" | string;
  total: number | string;
  items: OrderItem[];
  created_at: string;
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL!;

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [leavingIds, setLeavingIds] = useState<Record<number, true>>({});


  const [toast, setToast] = useState<{
    type: "success" | "error" | "info";
    message: string;
  } | null>(null);

  // 1) load initial
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/orders`, { cache: "no-store" });
        const data = await res.json();
        setOrders(Array.isArray(data) ? data : []);
      } catch (e: any) {
        setToast({ type: "error", message: `Load orders failed: ${e.message}` });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // 2) realtime
  useEffect(() => {
    const echo = makeEcho();

    // @ts-ignore
    echo.connector.pusher.connection.bind("connected", () => setConnected(true));
    // @ts-ignore
    echo.connector.pusher.connection.bind("disconnected", () => setConnected(false));
    // @ts-ignore
    echo.connector.pusher.connection.bind("error", (err: any) => {
      console.log("WS error:", err);
    });

    const channel = echo.channel("orders");

    channel.listen(".order.created", (e: { order: Order }) => {
      setOrders((prev) => {
        const exists = prev.some((o) => o.id === e.order.id);
        if (exists) return prev.map((o) => (o.id === e.order.id ? e.order : o));
        return [e.order, ...prev];
      });
    });

    channel.listen(".order.updated", (e: { order: Order }) => {
      setOrders((prev) => prev.map((o) => (o.id === e.order.id ? e.order : o)));
    });

    return () => {
      echo.leave("orders");
      echo.disconnect();
    };
  }, []);

async function markStatus(orderId: number, status: "completed" | "cancelled") {
  const snapshot = orders;

  try {
    setUpdatingId(orderId);

    // mark leaving => triggers animation
    setLeavingIds((prev) => ({ ...prev, [orderId]: true }));

    // wait animation
    await new Promise((r) => setTimeout(r, 600));

    // now update in DB
    const updated = await updateOrderStatus(orderId, status);

    // update UI order data (so if you show completed page later, it's correct)
    setOrders((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));

    // remove leaving flag
    setLeavingIds((prev) => {
      const copy = { ...prev };
      delete copy[orderId];
      return copy;
    });

    setToast({ type: "success", message: `✅ Order ${status}` });
  } catch (e: any) {
    setOrders(snapshot);
    setLeavingIds({});
    setToast({ type: "error", message: `❌ Update failed: ${e.message}` });
  } finally {
    setUpdatingId(null);
  }
}



  const totalOrders = useMemo(() => orders.length, [orders]);

  return (
    <div className="space-y-6">
      {/* ✅ Toast */}
      {toast && (
        <div className="fixed right-6 top-6 z-50 rounded-xl bg-black px-4 py-3 text-sm text-white shadow-lg">
          {toast.message}
          <button className="ml-3 underline" onClick={() => setToast(null)}>
            close
          </button>
        </div>
      )}

      <div className="rounded-2xl bg-[#99613f] p-6 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-white">Orders</h1>
          </div>

          <div className="text-right">
            <div className="text-sm text-gray-200">Realtime</div>
            <div
              className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ${
                connected ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
              }`}
            >
              {connected ? "Connected" : "Disconnected"}
            </div>
          </div>
        </div>

        <div className="mt-3 text-xl text-green-300">
          Total orders: <span className="font-semibold">{totalOrders}</span>
        </div>
      </div>

      <div className="rounded-2xl bg-[#99613f] p-6 shadow-sm">
        {loading ? (
          <div className="text-sm text-gray-900">Loading...</div>
        ) : orders.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 p-10 text-center">
            <div className="text-lg font-bold text-white">No orders yet</div>
          </div>
        ) : (
          <div className="space-y-3">
            {orders
            .filter((o) => o.status === "pending" || leavingIds[o.id])
            .map((o) => (
            <div
               key={o.id}
               className={`rounded-2xl border border-gray-100 p-4 transition-all duration-500 ease-in-out ${
               leavingIds[o.id] ? "opacity-0 translate-x-6 scale-[0.98]" : "opacity-100 translate-x-0 scale-100"
              }`}
            >

                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="font-bold text-white">{o.reference}</div>

                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-black font-semibold">
                      {o.status}
                    </span>

                 {o.status === "pending" ? (
                 <div className="flex items-center gap-2">
                 <button
                  onClick={() => markStatus(o.id, "completed")}
                  disabled={updatingId === o.id}
                  className="rounded-full bg-green-600 px-3 py-1 text-xs font-bold text-white hover:bg-green-700 disabled:opacity-60"
                >
               {updatingId === o.id ? "Saving..." : "Complete"}
              </button>

                  <button
                       onClick={() => markStatus(o.id, "cancelled")}
                       disabled={updatingId === o.id}
                       className="rounded-full bg-red-600 px-3 py-1 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-60"
                      >
                    {updatingId === o.id ? "Saving..." : "Cancel"}
                  </button>
                </div>
                  ) : o.status === "completed" ? (
                    <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-800">
                    Done
                     </span>
                       ) : (
                 <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-800">
                   Cancelled
                   </span>
                 )}


                    <span className="text-sm text-white">
                      Total:{" "}
                      <span className="font-semibold">
                        ${Number(o.total).toFixed(2)}
                      </span>
                    </span>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {o.items?.map((it, idx) => (
                    <span key={idx} className="rounded-xl bg-gray-50 text-black px-3 py-2 text-sm">
                      <span className="font-semibold">{it.qty}×</span> {it.name}  — $
                      {Number(it.price).toFixed(2)}
                      <div className="text-black font-bold">Size: {it.size}</div>
                      <div className="text-black font-bold">Sugar: {it.sugar}</div>
                    </span>
                  ))}
                </div>

                <div className="mt-2 text-xs text-white">
                  Created: {new Date(o.created_at).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

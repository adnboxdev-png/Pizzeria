"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from "recharts";
import { supabase } from "@/lib/supabaseClient";
import type { Order, OrderItem } from "@/types/database";

const COLORS = ["#C1440E", "#2F4B3C", "#F2B441", "#8F2E0A", "#6B6259"];

export function SalesCharts() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(14);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const since = new Date();
      since.setDate(since.getDate() - days);

      const { data: ordersData } = await supabase
        .from("orders")
        .select("*")
        .eq("status", "entregada")
        .gte("created_at", since.toISOString())
        .order("created_at", { ascending: true });

      const orderList = (ordersData as unknown as Order[]) ?? [];
      setOrders(orderList);

      if (orderList.length > 0) {
        const { data: itemsData } = await supabase
          .from("order_items")
          .select("*")
          .in("order_id", orderList.map((o) => o.id));
        setItems((itemsData as unknown as OrderItem[]) ?? []);
      } else {
        setItems([]);
      }
      setLoading(false);
    };
    load();
  }, [days]);

  const dailySales = useMemo(() => {
    const map = new Map<string, number>();
    for (const o of orders) {
      const day = new Date(o.created_at).toLocaleDateString("es-MX", { day: "2-digit", month: "short" });
      map.set(day, (map.get(day) ?? 0) + Number(o.total));
    }
    return Array.from(map.entries()).map(([day, total]) => ({ day, total }));
  }, [orders]);

  const topProducts = useMemo(() => {
    const map = new Map<string, number>();
    for (const it of items) {
      map.set(it.product_name, (map.get(it.product_name) ?? 0) + it.quantity);
    }
    return Array.from(map.entries())
      .map(([name, cantidad]) => ({ name, cantidad }))
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 8);
  }, [items]);

  const totalVentas = orders.reduce((sum, o) => sum + Number(o.total), 0);
  const ticketPromedio = orders.length > 0 ? totalVentas / orders.length : 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-xl text-carbon">Desempeño de ventas</h2>
        <select
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          className="rounded-lg border border-carbon/15 px-3 py-1.5 text-sm bg-white"
        >
          <option value={7}>Últimos 7 días</option>
          <option value={14}>Últimos 14 días</option>
          <option value={30}>Últimos 30 días</option>
          <option value={90}>Últimos 90 días</option>
        </select>
      </div>

      <div className="grid sm:grid-cols-3 gap-3 mb-6">
        <div className="bg-white rounded-xl border border-carbon/10 p-4">
          <p className="text-xs text-humo">Ventas totales</p>
          <p className="font-display text-2xl text-tomate">${totalVentas.toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-xl border border-carbon/10 p-4">
          <p className="text-xs text-humo">Órdenes entregadas</p>
          <p className="font-display text-2xl text-albahaca">{orders.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-carbon/10 p-4">
          <p className="text-xs text-humo">Ticket promedio</p>
          <p className="font-display text-2xl text-carbon">${ticketPromedio.toFixed(2)}</p>
        </div>
      </div>

      {loading ? (
        <p className="text-humo text-sm">Cargando gráficos…</p>
      ) : orders.length === 0 ? (
        <p className="text-humo text-sm">Aún no hay ventas entregadas en este periodo.</p>
      ) : (
        <div className="grid lg:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-carbon/10 p-4">
            <h3 className="text-sm font-medium text-carbon mb-2">Histórico de ventas por día</h3>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={dailySales}>
                <CartesianGrid strokeDasharray="3 3" stroke="#23232310" />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Line type="monotone" dataKey="total" stroke="#C1440E" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-xl border border-carbon/10 p-4">
            <h3 className="text-sm font-medium text-carbon mb-2">Productos más vendidos</h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={topProducts} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#23232310" />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={90} />
                <Tooltip />
                <Bar dataKey="cantidad" fill="#2F4B3C" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}

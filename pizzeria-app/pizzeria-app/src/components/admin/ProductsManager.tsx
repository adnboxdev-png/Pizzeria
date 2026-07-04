"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/context/AuthContext";
import type { Product, ProductFlavor, ProductSize } from "@/types/database";

const CATEGORIES = ["pizza", "alitas", "papas", "bebida", "postre", "otro"];

export function ProductsManager() {
  const { profile } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const [name, setName] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [basePrice, setBasePrice] = useState("0");
  const [imageUrl, setImageUrl] = useState("");
  const [sizes, setSizes] = useState<ProductSize[]>([]);
  const [flavors, setFlavors] = useState<ProductFlavor[]>([]);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("products")
      .select("*")
      .order("active", { ascending: false })
      .order("category")
      .order("name");
    setProducts((data as unknown as Product[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const resetForm = () => {
    setName("");
    setCategory(CATEGORIES[0]);
    setBasePrice("0");
    setImageUrl("");
    setSizes([]);
    setFlavors([]);
  };

  const addProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    await supabase.from("products").insert({
      name: name.trim(),
      category,
      base_price: sizes.length > 0 ? 0 : Number(basePrice) || 0,
      image_url: imageUrl.trim() || null,
      sizes,
      flavors,
      active: true,
      created_by: profile?.id
    } as never);
    setSaving(false);
    setShowForm(false);
    resetForm();
    load();
  };

  const toggleActive = async (product: Product) => {
    await supabase.from("products").update({ active: !product.active } as never).eq("id", product.id);
    load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-xl text-carbon">Productos</h2>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="bg-tomate text-white rounded-lg px-4 py-2 text-sm hover:bg-tomateOsc transition-colors"
        >
          {showForm ? "Cancelar" : "+ Agregar producto"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={addProduct} className="bg-white rounded-xl border border-carbon/10 p-5 mb-6 space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-humo mb-1">Nombre</label>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-carbon/15 px-3 py-2"
                placeholder="Ej. Pizza, Alitas, Papas Gajo…"
              />
            </div>
            <div>
              <label className="block text-sm text-humo mb-1">Categoría</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-lg border border-carbon/15 px-3 py-2"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-humo mb-1">Imagen (URL)</label>
              <input
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="w-full rounded-lg border border-carbon/15 px-3 py-2"
                placeholder="https://…"
              />
            </div>
            {sizes.length === 0 && (
              <div>
                <label className="block text-sm text-humo mb-1">Precio base (si no tiene tamaños)</label>
                <input
                  type="number"
                  step="0.01"
                  value={basePrice}
                  onChange={(e) => setBasePrice(e.target.value)}
                  className="w-full rounded-lg border border-carbon/15 px-3 py-2"
                />
              </div>
            )}
          </div>

          {/* Tamaños */}
          <div>
            <div className="flex items-center justify-between">
              <label className="block text-sm text-humo mb-1">Tamaños con precio (opcional)</label>
              <button
                type="button"
                onClick={() => setSizes((s) => [...s, { name: "", price: 0 }])}
                className="text-xs text-tomate hover:underline"
              >
                + agregar tamaño
              </button>
            </div>
            <div className="space-y-2">
              {sizes.map((s, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    placeholder="Nombre (Chica, Grande…)"
                    value={s.name}
                    onChange={(e) => {
                      const copy = [...sizes];
                      copy[i] = { ...copy[i], name: e.target.value };
                      setSizes(copy);
                    }}
                    className="flex-1 rounded-lg border border-carbon/15 px-3 py-1.5 text-sm"
                  />
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Precio"
                    value={s.price}
                    onChange={(e) => {
                      const copy = [...sizes];
                      copy[i] = { ...copy[i], price: Number(e.target.value) };
                      setSizes(copy);
                    }}
                    className="w-28 rounded-lg border border-carbon/15 px-3 py-1.5 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setSizes(sizes.filter((_, idx) => idx !== i))}
                    className="text-humo hover:text-tomate px-2"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Sabores / extras */}
          <div>
            <div className="flex items-center justify-between">
              <label className="block text-sm text-humo mb-1">Sabores / extras con costo adicional (opcional)</label>
              <button
                type="button"
                onClick={() => setFlavors((f) => [...f, { name: "", extra_price: 0 }])}
                className="text-xs text-tomate hover:underline"
              >
                + agregar sabor
              </button>
            </div>
            <div className="space-y-2">
              {flavors.map((f, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    placeholder="Nombre (BBQ, Búfalo…)"
                    value={f.name}
                    onChange={(e) => {
                      const copy = [...flavors];
                      copy[i] = { ...copy[i], name: e.target.value };
                      setFlavors(copy);
                    }}
                    className="flex-1 rounded-lg border border-carbon/15 px-3 py-1.5 text-sm"
                  />
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Costo extra"
                    value={f.extra_price}
                    onChange={(e) => {
                      const copy = [...flavors];
                      copy[i] = { ...copy[i], extra_price: Number(e.target.value) };
                      setFlavors(copy);
                    }}
                    className="w-28 rounded-lg border border-carbon/15 px-3 py-1.5 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setFlavors(flavors.filter((_, idx) => idx !== i))}
                    className="text-humo hover:text-tomate px-2"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="bg-albahaca text-white rounded-lg px-4 py-2 text-sm hover:opacity-90 disabled:opacity-60"
          >
            {saving ? "Guardando…" : "Guardar producto"}
          </button>
        </form>
      )}

      {loading ? (
        <p className="text-humo text-sm">Cargando productos…</p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {products.map((p) => (
            <div
              key={p.id}
              className={`rounded-xl border p-4 bg-white ${
                p.active ? "border-carbon/10" : "border-tomate/30 opacity-60"
              }`}
            >
              <div className="flex justify-between items-start mb-1">
                <h3 className="font-medium text-carbon">{p.name}</h3>
                <span className="text-[10px] uppercase tracking-wide text-humo bg-carbon/5 rounded px-1.5 py-0.5">
                  {p.category}
                </span>
              </div>
              {p.sizes.length > 0 ? (
                <p className="text-xs text-humo">
                  {p.sizes.map((s) => `${s.name}: $${s.price}`).join(" · ")}
                </p>
              ) : (
                <p className="text-xs text-humo">Precio: ${p.base_price}</p>
              )}
              {p.flavors.length > 0 && (
                <p className="text-xs text-humo mt-1">
                  Sabores: {p.flavors.map((f) => f.name).join(", ")}
                </p>
              )}
              <button
                onClick={() => toggleActive(p)}
                className={`mt-3 text-xs rounded-lg px-3 py-1.5 ${
                  p.active
                    ? "bg-tomate/10 text-tomateOsc hover:bg-tomate/20"
                    : "bg-albahaca/10 text-albahaca hover:bg-albahaca/20"
                }`}
              >
                {p.active ? "Desactivar" : "Reactivar"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

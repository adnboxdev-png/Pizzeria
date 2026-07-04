"use client";

import { useState } from "react";
import type { Product } from "@/types/database";
import type { CartLine } from "@/types/cart";

export function ProductModal({
  product,
  onClose,
  onAdd
}: {
  product: Product;
  onClose: () => void;
  onAdd: (line: CartLine) => void;
}) {
  const [sizeIdx, setSizeIdx] = useState(0);
  const [flavorIdx, setFlavorIdx] = useState<number | null>(product.flavors.length > 0 ? 0 : null);
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState("");

  const hasSizes = product.sizes.length > 0;
  const sizePrice = hasSizes ? product.sizes[sizeIdx].price : product.base_price;
  const flavorExtra = flavorIdx !== null ? product.flavors[flavorIdx].extra_price : 0;
  const total = (sizePrice + flavorExtra) * quantity;

  const handleAdd = () => {
    onAdd({
      key: `${product.id}-${Date.now()}`,
      product_id: product.id,
      product_name: product.name,
      size_name: hasSizes ? product.sizes[sizeIdx].name : null,
      size_price: sizePrice,
      flavor_name: flavorIdx !== null ? product.flavors[flavorIdx].name : null,
      flavor_extra: flavorExtra,
      quantity,
      notes: notes.trim() || null
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-carbon/50 z-40 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-4">
          <h2 className="font-display text-xl text-carbon">{product.name}</h2>
          <button onClick={onClose} className="text-humo hover:text-tomate text-xl leading-none">
            ✕
          </button>
        </div>

        {hasSizes && (
          <div className="mb-4">
            <p className="text-sm text-humo mb-2">Tamaño</p>
            <div className="grid grid-cols-3 gap-2">
              {product.sizes.map((s, i) => (
                <button
                  key={s.name}
                  onClick={() => setSizeIdx(i)}
                  className={`rounded-lg border py-2 text-sm ${
                    sizeIdx === i ? "border-tomate bg-tomate/10 text-tomateOsc" : "border-carbon/15 text-carbon"
                  }`}
                >
                  <span className="block font-medium">{s.name}</span>
                  <span className="block text-xs">${s.price}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {product.flavors.length > 0 && (
          <div className="mb-4">
            <p className="text-sm text-humo mb-2">Sabor</p>
            <div className="grid grid-cols-2 gap-2">
              {product.flavors.map((f, i) => (
                <button
                  key={f.name}
                  onClick={() => setFlavorIdx(i)}
                  className={`rounded-lg border py-2 text-sm ${
                    flavorIdx === i ? "border-tomate bg-tomate/10 text-tomateOsc" : "border-carbon/15 text-carbon"
                  }`}
                >
                  <span className="block font-medium">{f.name}</span>
                  {f.extra_price > 0 && <span className="block text-xs">+${f.extra_price}</span>}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mb-4">
          <p className="text-sm text-humo mb-2">Cantidad</p>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="h-9 w-9 rounded-lg bg-carbon/5 text-lg"
            >
              −
            </button>
            <span className="w-8 text-center font-medium">{quantity}</span>
            <button onClick={() => setQuantity((q) => q + 1)} className="h-9 w-9 rounded-lg bg-carbon/5 text-lg">
              +
            </button>
          </div>
        </div>

        <div className="mb-6">
          <p className="text-sm text-humo mb-2">Notas (opcional)</p>
          <input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ej. sin cebolla, extra salsa…"
            className="w-full rounded-lg border border-carbon/15 px-3 py-2 text-sm"
          />
        </div>

        <button
          onClick={handleAdd}
          className="w-full bg-tomate hover:bg-tomateOsc transition-colors text-white rounded-xl py-3 font-medium"
        >
          Agregar · ${total.toFixed(2)}
        </button>
      </div>
    </div>
  );
}
